# Chat Module — DDD-lite Refactor Plan

> Mục tiêu: tái thiết kế `services/platform/src/modules/chat/` từ MVC (Controller → Service → TypeORM Repository) sang **DDD-lite** trước khi hiện thực group chat. Bám sát convention đã có ở `modules/trip/` (aggregate + value object + repository port + command/query handlers tách `handles/` + `impls/`, mapper riêng cho TypeORM, DI tokens, domain errors kế thừa `AppError`). Realtime tiếp tục đi qua `core/realtime/REALTIME_EMITTER`.

## 1. Phân tích bounded context

Trước khi vẽ aggregate, định nghĩa rõ các bất biến cần bảo vệ khi có group chat:

| Bất biến | Aggregate giữ nó |
|---|---|
| Hội thoại direct là duy nhất giữa 2 user (`directKey` unique). | `Conversation` |
| Group phải có ít nhất 1 OWNER. Không ai đổi/xoá OWNER cuối cùng. | `Conversation` |
| Thành viên trong cùng hội thoại là duy nhất (không trùng). | `Conversation` |
| Chỉ OWNER/ADMIN mới được add/remove member, đổi role, đổi tên. | `Conversation` |
| Chỉ member còn active mới được gửi/đọc tin. | `Conversation` (check), `Message` (chỉ chứa sender đã được check) |
| Tin nhắn bất biến với người khác; sender chỉ được edit/xoá trong cửa sổ thời gian. | `Message` |
| Bump `updatedAt`/`lastMessageAt` của conversation khi có tin mới. | `Conversation` (qua domain event) |

Hai aggregate root đề xuất:

1. **`Conversation`** — boundary cho cấu trúc & quyền: type, title, members, role, settings.
2. **`Message`** — boundary cho từng tin nhắn (sender, body, edit/delete, attachments sau này).

Lý do **tách** `Message` khỏi `Conversation` (không nhét messages thành child collection như `trip → trip-day → trip-item`):

- Một conversation có thể có hàng chục nghìn tin nhắn. Aggregate phải nạp toàn bộ snapshot mỗi lần thao tác — không khả thi.
- Send/edit/delete một tin không cần biết tất cả tin khác.
- Đây là pattern chuẩn DDD: aggregate chỉ ôm những gì cần thiết cho invariant của nó.

Reference giữa 2 aggregate **bằng ID** (`Message.conversationId`), không phải object reference.

## 2. Cấu trúc thư mục mới

```text
modules/chat/
├── chat.module.ts
├── chat.di-tokens.ts
├── chat.constants.ts                       # events, room helpers — không business
├── domain/
│   ├── aggregates/
│   │   ├── conversation.aggregate.ts
│   │   └── message.aggregate.ts
│   ├── entities/
│   │   └── conversation-member.entity.ts   # child entity của Conversation
│   ├── enums/
│   │   ├── conversation-type.enum.ts       # DIRECT | GROUP
│   │   └── conversation-member-role.enum.ts# OWNER | ADMIN | MEMBER
│   ├── value-objects/
│   │   ├── direct-key.vo.ts
│   │   ├── message-body.vo.ts
│   │   └── conversation-title.vo.ts
│   ├── events/
│   │   └── chat.events.ts                  # ConversationCreated, MemberAdded, MessageSent, ...
│   └── errors/
│       ├── chat-domain.error.ts            # base
│       ├── conversation-not-member.error.ts
│       ├── conversation-forbidden.error.ts
│       ├── conversation-self-direct.error.ts
│       ├── conversation-last-owner.error.ts
│       ├── message-not-author.error.ts
│       └── message-edit-window-expired.error.ts
├── application/
│   ├── ports/
│   │   ├── conversation.repository.port.ts
│   │   ├── message.repository.port.ts
│   │   ├── user-lookup.port.ts             # tách dependency với UsersService
│   │   └── chat-event-bus.port.ts          # hoặc reuse pattern noop adapter
│   ├── commands/
│   │   ├── handles/
│   │   │   ├── create-or-get-direct-conversation.handler.ts
│   │   │   ├── create-group-conversation.handler.ts
│   │   │   ├── add-member.handler.ts
│   │   │   ├── remove-member.handler.ts
│   │   │   ├── leave-conversation.handler.ts
│   │   │   ├── change-member-role.handler.ts
│   │   │   ├── rename-conversation.handler.ts
│   │   │   ├── send-message.handler.ts
│   │   │   ├── edit-message.handler.ts
│   │   │   ├── delete-message.handler.ts
│   │   │   └── join-conversation-room.handler.ts   # WS-side use case
│   │   └── impls/
│   │       └── (mỗi command 1 file impl)
│   ├── queries/
│   │   ├── handles/
│   │   │   ├── list-my-conversations.handler.ts
│   │   │   ├── get-conversation-detail.handler.ts
│   │   │   └── list-messages.handler.ts
│   │   ├── impls/
│   │   │   └── ...
│   │   └── models/
│   │       ├── conversation-list-item.model.ts
│   │       ├── conversation-detail.model.ts
│   │       └── message-list.model.ts
│   └── services/
│       └── chat-realtime.notifier.ts        # subscribe domain events → REALTIME_EMITTER
├── infrastructure/
│   ├── persistence/
│   │   ├── typeorm/
│   │   │   ├── conversation.orm-entity.ts
│   │   │   ├── conversation-member.orm-entity.ts
│   │   │   └── message.orm-entity.ts
│   │   ├── mappers/
│   │   │   ├── conversation.mapper.ts
│   │   │   └── message.mapper.ts
│   │   └── repositories/
│   │       ├── typeorm-conversation.repository.ts
│   │       └── typeorm-message.repository.ts
│   ├── lookups/
│   │   └── users-service-user-lookup.adapter.ts  # implement UserLookupPort bằng UsersService
│   └── events/
│       └── nest-chat-event-bus.adapter.ts        # hoặc dùng @nestjs/event-emitter; bắt đầu = noop
└── presentation/
    ├── controllers/
    │   └── chat.controller.ts          # thin, gọi handler
    ├── gateways/
    │   └── chat.gateway.ts             # thin, gọi join-conversation-room handler
    ├── dtos/
    │   ├── create-direct-conversation.dto.ts
    │   ├── create-group-conversation.dto.ts
    │   ├── add-member.dto.ts
    │   ├── change-member-role.dto.ts
    │   ├── send-message.dto.ts
    │   ├── edit-message.dto.ts
    │   ├── list-messages.query.dto.ts
    │   └── conversation-response.dto.ts
    └── mappers/
        └── conversation-presentation.mapper.ts   # snapshot → DTO
```

## 3. Domain layer chi tiết

### 3.1 Enums

```ts
// domain/enums/conversation-type.enum.ts
export enum ConversationType { DIRECT = 'direct', GROUP = 'group' }

// domain/enums/conversation-member-role.enum.ts
export enum ConversationMemberRole { OWNER = 'owner', ADMIN = 'admin', MEMBER = 'member' }
```

### 3.2 Value Objects

- `DirectKeyVO`: nhận 2 userId, validate `userA !== userB`, expose `value` đã sort+join. Thay thế hàm `buildDirectConversationKey` toàn cục bằng VO; service không tự build nữa.
- `MessageBodyVO`: trim, validate length `1..4000`, immutable; thay vì validation rải rác `dto.body.trim()` trong service.
- `ConversationTitleVO`: chỉ áp dụng cho `GROUP`, length 1..120.

VO ném domain errors (`InvalidMessageBodyError`, …) — không phụ thuộc Nest.

### 3.3 Child entity: `ConversationMemberEntity`

Mang state per-member: `userId`, `role`, `joinedAt`, `lastReadMessageId | null`. Có method:

- `changeRole(newRole, actorRole)` → enforce: chỉ OWNER được promote/demote OWNER.
- `markRead(messageId)`.

### 3.4 Aggregate `Conversation`

```ts
// pseudo-code
export class Conversation {
  private constructor(private readonly snapshot: ConversationSnapshot) {}

  // Factories
  static createDirect(input: { userIdA: string; userIdB: string }): Conversation;
  static createGroup(input: { creatorUserId: string; title: string; memberUserIds: string[] }): Conversation;
  static reconstitute(snapshot: ConversationSnapshot): Conversation;

  // Mutators (mỗi method bảo vệ 1 nhóm invariant)
  rename(newTitle: string, actorUserId: string): void;
  addMember(targetUserId: string, actorUserId: string): void;
  removeMember(targetUserId: string, actorUserId: string): void;
  leave(actorUserId: string): void;
  changeMemberRole(targetUserId: string, newRole: ConversationMemberRole, actorUserId: string): void;
  touchActivity(at: Date): void;                       // gọi khi MessageSent xảy ra

  // Queries dùng nội bộ application layer
  ensureMember(userId: string): void;                  // throw ConversationNotMemberError
  ensureCanModerate(userId: string): void;             // throw ConversationForbiddenError
  isDirect(): boolean;
  members(): ReadonlyArray<MemberSnapshot>;

  toSnapshot(): ConversationSnapshot;                  // dùng cho mapper
  pullDomainEvents(): ChatDomainEvent[];               // event sourcing-style
}
```

Bất biến enforce ngay trong aggregate:

- `createDirect`: throw `ConversationSelfDirectError` nếu trùng; tự tính `directKey` qua `DirectKeyVO`.
- `removeMember` / `changeMemberRole`: throw `ConversationLastOwnerError` nếu hành động khiến group còn 0 OWNER.
- `addMember`/`removeMember` cho `DIRECT` → throw `ConversationInvalidOperationError`.
- Mỗi mutation push event vào `_events` để publish sau khi save.

### 3.5 Aggregate `Message`

```ts
export class Message {
  static create(input: { conversationId: string; senderUserId: string; body: MessageBodyVO }): Message;
  static reconstitute(snapshot: MessageSnapshot): Message;

  edit(newBody: MessageBodyVO, actorUserId: string, now: Date): void;   // sender + within window
  delete(actorUserId: string, actorRole: ConversationMemberRole): void; // sender OR admin/owner

  isAuthor(userId: string): boolean;
  toSnapshot(): MessageSnapshot;
  pullDomainEvents(): ChatDomainEvent[];
}
```

`Message` không biết về `Conversation.members`; ứng dụng phải nạp `Conversation` và `.ensureCanModerate(actorUserId)` trước khi đưa `actorRole` vào `delete(...)`.

### 3.6 Domain Events

```ts
// domain/events/chat.events.ts
export interface ConversationCreated { conversationId: string; type: ConversationType; memberUserIds: string[]; at: Date; }
export interface MemberAdded         { conversationId: string; userId: string; addedBy: string; at: Date; }
export interface MemberRemoved       { conversationId: string; userId: string; removedBy: string; at: Date; }
export interface MemberRoleChanged   { conversationId: string; userId: string; newRole: ConversationMemberRole; at: Date; }
export interface MessageSent         { messageId: string; conversationId: string; senderUserId: string; body: string; at: Date; }
export interface MessageEdited       { messageId: string; conversationId: string; body: string; editedAt: Date; }
export interface MessageDeleted      { messageId: string; conversationId: string; deletedBy: string; at: Date; }
```

Một adapter cross-cutting (`ChatRealtimeNotifier`) subscribe các event này → đẩy WS:

- `MessageSent`/`Edited`/`Deleted` → `emitToRoom('conversation:<id>', ...)`.
- `MemberAdded` → `emitToUser(addedUserId, ...)` để client mới biết và join room.

Phần WS đó **biến mất khỏi use case** — `SendMessageHandler` chỉ gọi `messageRepository.save` + publish event; emit là chuyện adapter.

### 3.7 Domain errors

Tương tự `TripDomainError`, base class kế thừa `AppError`:

```ts
export class ChatDomainError extends AppError {
  constructor(message: string, statusCode = 409, error = 'Conflict') { super(message, statusCode, error); }
}
export class ConversationNotMemberError    extends ChatDomainError { constructor() { super('conversation_not_member', 403, 'Forbidden'); } }
export class ConversationForbiddenError    extends ChatDomainError { constructor() { super('conversation_forbidden', 403, 'Forbidden'); } }
export class ConversationSelfDirectError   extends ChatDomainError { constructor() { super('cannot_chat_with_self', 400, 'Bad Request'); } }
export class ConversationLastOwnerError    extends ChatDomainError { constructor() { super('conversation_must_have_owner', 409); } }
export class MessageNotAuthorError         extends ChatDomainError { constructor() { super('message_not_author', 403, 'Forbidden'); } }
export class MessageEditWindowExpiredError extends ChatDomainError { constructor() { super('message_edit_window_expired', 409); } }
```

Filter toàn cục đã map `AppError → HTTP` rồi, không cần làm gì thêm.

## 4. Application layer

### 4.1 Ports

```ts
// application/ports/conversation.repository.port.ts
export interface ConversationRepositoryPort {
  save(conversation: Conversation): Promise<void>;
  findById(id: string): Promise<Conversation | null>;
  findDirectByKey(directKey: string): Promise<Conversation | null>;
  findIdsByMemberUserId(userId: string, page: number, limit: number): Promise<string[]>;
}

// application/ports/message.repository.port.ts
export interface MessageRepositoryPort {
  save(message: Message): Promise<void>;
  findById(id: string): Promise<Message | null>;
  listByConversation(input: {
    conversationId: string;
    cursor?: { createdAt: Date; id: string } | null;
    limit: number;
  }): Promise<{ items: Message[]; nextCursor: { createdAt: Date; id: string } | null }>;
}

// application/ports/user-lookup.port.ts
export interface UserLookupPort {
  exists(userId: string): Promise<boolean>;                        // active && !deleted
  existAll(userIds: string[]): Promise<boolean>;
}

// application/ports/chat-event-bus.port.ts
export interface ChatEventBusPort {
  publish(events: ChatDomainEvent[]): Promise<void>;
}
```

Lý do có `UserLookupPort` thay vì inject thẳng `UsersService`: tách `chat` khỏi internal của `user`, đúng "feature-to-feature qua port".

### 4.2 Command handlers (mỗi command = 1 file `handles/` + 1 `impls/`)

Đại diện `SendMessageHandler`:

```ts
// handles/send-message.handler.ts
export interface SendMessageCommand {
  actorUserId: string;
  conversationId: string;
  body: string;
}
export interface SendMessageResult {
  id: string; conversationId: string; senderUserId: string; body: string; createdAt: string; updatedAt: string;
}
export abstract class SendMessageHandler {
  abstract execute(cmd: SendMessageCommand): Promise<SendMessageResult>;
}
```

```ts
// impls/send-message.handler.impl.ts (rút gọn)
@Injectable()
export class SendMessageHandlerImpl implements SendMessageHandler {
  constructor(
    @Inject(CONVERSATION_REPOSITORY) private readonly convRepo: ConversationRepositoryPort,
    @Inject(MESSAGE_REPOSITORY)      private readonly msgRepo: MessageRepositoryPort,
    @Inject(CHAT_EVENT_BUS)          private readonly eventBus: ChatEventBusPort,
    private readonly unitOfWork: ChatUnitOfWork,         // optional, xem 5.3
  ) {}

  async execute(cmd: SendMessageCommand): Promise<SendMessageResult> {
    const conv = await this.convRepo.findById(cmd.conversationId);
    if (!conv) throw new ResourceNotFoundError('conversation_not_found');
    conv.ensureMember(cmd.actorUserId);

    const body    = new MessageBodyVO(cmd.body);
    const message = Message.create({ conversationId: conv.id, senderUserId: cmd.actorUserId, body });
    conv.touchActivity(new Date());

    await this.unitOfWork.run(async () => {
      await this.msgRepo.save(message);
      await this.convRepo.save(conv);
    });

    await this.eventBus.publish([...message.pullDomainEvents(), ...conv.pullDomainEvents()]);
    return ChatMapper.toMessageResult(message);
  }
}
```

So với `ChatService.sendMessage` cũ:

- Validate body → VO (chỉ định nghĩa 1 chỗ).
- Membership check → method aggregate.
- Save message + bump conversation → **trong cùng một transaction** (giải quyết tồn đọng đã nêu).
- Emit WS → không xuất hiện ở đây; `ChatRealtimeNotifier` nghe event `MessageSent` rồi emit.

`CreateOrGetDirectConversationHandlerImpl`:

```ts
async execute(cmd): Promise<ConversationResult> {
  if (cmd.actorUserId === cmd.otherUserId) throw new ConversationSelfDirectError();
  if (!(await this.userLookup.exists(cmd.otherUserId))) throw new ResourceNotFoundError('user_not_found');

  const directKey = new DirectKeyVO(cmd.actorUserId, cmd.otherUserId).value;
  const existing = await this.convRepo.findDirectByKey(directKey);
  if (existing) {
    existing.ensureMember(cmd.actorUserId);
    return ChatMapper.toConversationResult(existing);
  }

  const conv = Conversation.createDirect({ userIdA: cmd.actorUserId, userIdB: cmd.otherUserId });
  try {
    await this.convRepo.save(conv);
  } catch (e) {
    if (isUniqueViolation(e, 'IDX_conversations_direct_key')) {
      const racedExisting = await this.convRepo.findDirectByKey(directKey);
      if (racedExisting) return ChatMapper.toConversationResult(racedExisting);
    }
    throw e;
  }

  await this.eventBus.publish(conv.pullDomainEvents());
  return ChatMapper.toConversationResult(conv);
}
```

Cũng giải quyết được race condition đã nêu lần trước.

### 4.3 Query handlers (Read side)

`ListMyConversationsHandler` không nên đi qua aggregate (tránh nạp aggregate 1-by-1 chỉ để build list). Đây là read model — repository có thể expose query riêng trả raw projection:

```ts
// application/queries/handles/list-my-conversations.handler.ts
export interface ListMyConversationsQuery { actorUserId: string; }
export interface ConversationListItemModel {
  id: string; type: ConversationType; title: string | null;
  lastMessage: { id: string; body: string; senderUserId: string; createdAt: string } | null;
  unreadCount: number;
  members: { userId: string; role: ConversationMemberRole }[];
  updatedAt: string;
}
export abstract class ListMyConversationsHandler {
  abstract execute(q: ListMyConversationsQuery): Promise<ConversationListItemModel[]>;
}
```

Impl tự viết query (`leftJoin` `messages` lấy `lastMessage`, `count` chưa đọc). Read side **được phép** vượt qua repository aggregate, dùng QueryBuilder/raw SQL — đúng DDD-lite rule trong dự án: *"Reporting / read models → do not route reads through a rich domain model"*.

`ListMessagesHandler` đổi sang **cursor pagination** (`before=<createdAt|id>`, `limit`) — fix tồn đọng đã nêu.

`JoinConversationRoomHandler` (dùng bởi Gateway):

```ts
abstract class JoinConversationRoomHandler {
  abstract execute(input: { actorUserId: string; conversationId: string }): Promise<void>;
}
```

Impl chỉ load `Conversation` và gọi `ensureMember(actorUserId)`. Gateway sau đó gọi `client.join(...)` — phần ấy là transport, vẫn ở presentation.

### 4.4 `ChatRealtimeNotifier`

Một `@Injectable()` subscribe `ChatEventBusPort` (nếu dùng `@nestjs/event-emitter` thì là `@OnEvent('chat.message.sent')` …):

```ts
@OnEvent('chat.message.sent')
async onMessageSent(e: MessageSent) {
  await this.realtime.emitToRoom(conversationRoom(e.conversationId), 'chat:message:new', { ... });
}

@OnEvent('chat.member.added')
async onMemberAdded(e: MemberAdded) {
  await this.realtime.emitToUser(e.userId, 'chat:conversation:invited', { conversationId: e.conversationId });
}
```

Tách side-effect khỏi use case → SRP rõ ràng và test được riêng.

## 5. Infrastructure layer

### 5.1 ORM entities tách hẳn khỏi domain

- `ConversationOrmEntity` (chỉ field + relation, không decorator nghiệp vụ).
- `ConversationMemberOrmEntity` (giữ thêm `role: varchar(16)`, `lastReadMessageId: uuid | null` cho group chat).
- `MessageOrmEntity` (thêm `editedAt`, `deletedAt` nếu hỗ trợ edit/delete; index `(conversationId, createdAt DESC)` giữ nguyên).

Mapper: `ConversationMapper.toPersistence(aggregate)` / `toDomain(orm)` — đúng như `TripMapper`.

### 5.2 Repository implementations

`TypeormConversationRepository` lưu Conversation + members trong **một** transaction (giống `TypeormTripRepository` xử lý orphan children). Khi `save` cho conversation đã tồn tại, xoá những member không còn trong snapshot.

`TypeormMessageRepository.save` chỉ insert/update 1 row. `listByConversation` dùng QueryBuilder cursor:

```ts
qb.where('m.conversationId = :id', { id })
  .andWhere('m.deletedAt IS NULL')
  .orderBy('m.createdAt', 'DESC').addOrderBy('m.id', 'DESC')
  .take(limit + 1);
if (cursor) {
  qb.andWhere('(m.createdAt, m.id) < (:cAt, :cId)', { cAt: cursor.createdAt, cId: cursor.id });
}
```

### 5.3 Unit of Work cho cross-aggregate atomicity

`SendMessageHandler` cần atomicity giữa `Message` (insert) và `Conversation` (`updatedAt` / `lastMessageAt` bump) — 2 aggregate, 2 repository. Một thin `ChatUnitOfWork` wrap `DataSource.transaction` và tạm thời gán `EntityManager` cho cả 2 repository (ví dụ: thông qua `AsyncLocalStorage` hoặc context arg). Đây là phần "lite" mà nhiều DDD project chấp nhận thay vì kéo full UoW pattern.

> Nếu không muốn introduce UoW ngay, fallback đơn giản: implement `SendMessageHandler` qua một thao tác duy nhất ở `ConversationRepository.saveWithNewMessage(conv, message)` — đặt logic insert/update vào persistence layer trong cùng `manager.transaction`. Có nhược điểm coupling 2 aggregate ở infra.

### 5.4 `UsersServiceUserLookupAdapter`

```ts
@Injectable()
export class UsersServiceUserLookupAdapter implements UserLookupPort {
  constructor(private readonly usersService: UsersService) {}

  async exists(userId: string) {
    const u = await this.usersService.findById(userId);
    return !!u && u.isActive && u.deletedAt === null;
  }

  async existAll(ids: string[]) { /* batched */ }
}
```

Domain/application không còn biết tới `UsersService`.

### 5.5 Realtime adapter

Vẫn dùng `REALTIME_EMITTER` của `core/realtime`. Không cần adapter mới trong chat. `ChatRealtimeNotifier` ở tầng application/infrastructure (tuỳ bạn xếp — đề xuất để `application/services/` vì nó là orchestration cross-cutting đặc thù chat).

## 6. Presentation layer

### 6.1 Controller — vẫn thin, nhưng inject **handlers** thay vì service

```ts
@Controller('chat/conversations')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(
    private readonly listMyConversations: ListMyConversationsHandler,
    private readonly createDirect:        CreateOrGetDirectConversationHandler,
    private readonly createGroup:         CreateGroupConversationHandler,
    private readonly addMember:           AddMemberHandler,
    private readonly removeMember:        RemoveMemberHandler,
    private readonly leave:               LeaveConversationHandler,
    private readonly changeRole:          ChangeMemberRoleHandler,
    private readonly rename:              RenameConversationHandler,
    private readonly listMessages:        ListMessagesHandler,
    private readonly sendMessage:         SendMessageHandler,
    private readonly editMessage:         EditMessageHandler,
    private readonly deleteMessage:       DeleteMessageHandler,
  ) {}
  // mỗi method 1-2 dòng: gọi handler và return
}
```

Endpoints mới cho group chat:

| Method | Path | Handler |
|---|---|---|
| `POST` | `/chat/conversations/group` | `CreateGroupConversationHandler` |
| `POST` | `/chat/conversations/:id/members` | `AddMemberHandler` |
| `DELETE` | `/chat/conversations/:id/members/:userId` | `RemoveMemberHandler` |
| `POST` | `/chat/conversations/:id/leave` | `LeaveConversationHandler` |
| `PATCH` | `/chat/conversations/:id/members/:userId/role` | `ChangeMemberRoleHandler` |
| `PATCH` | `/chat/conversations/:id` | `RenameConversationHandler` |
| `PATCH` | `/chat/conversations/:id/messages/:messageId` | `EditMessageHandler` |
| `DELETE` | `/chat/conversations/:id/messages/:messageId` | `DeleteMessageHandler` |

### 6.2 Gateway

```ts
@WebSocketGateway({ namespace: '/chat', cors: gatewayCorsFromEnv() })
export class ChatGateway implements OnGatewayConnection {
  constructor(
    private readonly wsAuth:   WsAuthService,
    private readonly joinRoom: JoinConversationRoomHandler,
  ) {}

  async handleConnection(client: Socket) {
    try { client.data.user = await this.wsAuth.authenticate(client); }
    catch { client.disconnect(true); }
  }

  @SubscribeMessage(CHAT_WS_EVENTS.JOIN_CONVERSATION)
  async join(@ConnectedSocket() c: Socket, @MessageBody() body: { conversationId?: string }) {
    const userId = c.data?.user?.sub;
    if (!userId || !body?.conversationId) return { ok: false };
    await this.joinRoom.execute({ actorUserId: userId, conversationId: body.conversationId });
    await c.join(conversationRoom(body.conversationId));
    return { ok: true };
  }
}
```

Gateway không còn import `ChatService`; bất biến membership được giữ qua handler/aggregate.

## 7. Module wiring

```ts
// chat.di-tokens.ts
export const CONVERSATION_REPOSITORY = Symbol('CONVERSATION_REPOSITORY');
export const MESSAGE_REPOSITORY      = Symbol('MESSAGE_REPOSITORY');
export const USER_LOOKUP             = Symbol('USER_LOOKUP');
export const CHAT_EVENT_BUS          = Symbol('CHAT_EVENT_BUS');
```

```ts
// chat.module.ts (rút gọn)
@Module({
  imports: [
    TypeOrmModule.forFeature([ConversationOrmEntity, ConversationMemberOrmEntity, MessageOrmEntity]),
    UsersModule,
    EventEmitterModule, // hoặc tự định nghĩa NestChatEventBusAdapter dùng EventEmitter2
  ],
  controllers: [ChatController],
  providers: [
    ConversationMapper, MessageMapper, ChatUnitOfWork, ChatRealtimeNotifier,
    { provide: CONVERSATION_REPOSITORY, useClass: TypeormConversationRepository },
    { provide: MESSAGE_REPOSITORY,      useClass: TypeormMessageRepository },
    { provide: USER_LOOKUP,             useClass: UsersServiceUserLookupAdapter },
    { provide: CHAT_EVENT_BUS,          useClass: NestChatEventBusAdapter },

    { provide: CreateOrGetDirectConversationHandler, useClass: CreateOrGetDirectConversationHandlerImpl },
    { provide: CreateGroupConversationHandler,       useClass: CreateGroupConversationHandlerImpl },
    { provide: AddMemberHandler,                     useClass: AddMemberHandlerImpl },
    { provide: RemoveMemberHandler,                  useClass: RemoveMemberHandlerImpl },
    { provide: LeaveConversationHandler,             useClass: LeaveConversationHandlerImpl },
    { provide: ChangeMemberRoleHandler,              useClass: ChangeMemberRoleHandlerImpl },
    { provide: RenameConversationHandler,            useClass: RenameConversationHandlerImpl },
    { provide: SendMessageHandler,                   useClass: SendMessageHandlerImpl },
    { provide: EditMessageHandler,                   useClass: EditMessageHandlerImpl },
    { provide: DeleteMessageHandler,                 useClass: DeleteMessageHandlerImpl },
    { provide: JoinConversationRoomHandler,          useClass: JoinConversationRoomHandlerImpl },
    { provide: ListMyConversationsHandler,           useClass: ListMyConversationsHandlerImpl },
    { provide: GetConversationDetailHandler,         useClass: GetConversationDetailHandlerImpl },
    { provide: ListMessagesHandler,                  useClass: ListMessagesHandlerImpl },

    ...(realtimeEnabled ? [ChatGateway] : []),
  ],
  exports: [SendMessageHandler],   // các module khác cần broadcast tin nhắn (system message) có thể dùng
})
export class ChatModule {}
```

## 8. Migration plan (thứ tự an toàn)

Không thay đổi DB schema gốc trong bước đầu, để tránh refactor lớn cùng lúc:

1. **Tạo skeleton mới song song** trong `domain/`, `application/`, `infrastructure/`, `presentation/`. ORM entities mới đặt cùng bảng cũ (`conversations`, `messages`, `conversation_members`) — chỉ là tên class khác.
2. Viết mapper + repository TypeORM cho 2 aggregate, **chưa wire** vào controller.
3. Tạo handler từng cái, viết test (vì giờ aggregate thuần Node nên test cực dễ — không cần Nest DI).
4. Migration mới thêm cột `role`, `lastReadMessageId` cho `conversation_members`, thêm `editedAt`, `deletedBy` cho `messages` (nếu muốn). Nếu chưa làm group chat đợt này, có thể bỏ qua bước này.
5. Switch `ChatController` từ `ChatService` cũ → handlers mới (sau khi parity test pass).
6. Switch `ChatGateway` sang `JoinConversationRoomHandler`.
7. Xoá `services/chat.service.ts`, `entities/*.entity.ts`, `controllers/chat.controller.ts`, `gateways/chat.gateway.ts` cũ; `dto/` cũ chuyển vào `presentation/dtos/`.
8. Thêm endpoints group chat.

## 9. Lợi ích so với MVC hiện tại

| Vấn đề cũ | Giải pháp DDD-lite tương ứng |
|---|---|
| `sendMessage` insert + bump không atomic | `ChatUnitOfWork` (hoặc `repository.saveWithNewMessage`) trong cùng transaction |
| Race condition `directKey` không bắt | `try/catch` unique-violation trong `CreateOrGetDirectConversationHandlerImpl` |
| `listMyConversations` thiếu `lastMessage`/`unreadCount` | Read model riêng (`ConversationListItemModel`) ở query handler |
| Offset pagination dễ trượt | Cursor pagination ở `ListMessagesHandler` |
| Chỉ direct, khó mở rộng group | Aggregate `Conversation` đã có `members + role`, factory `createGroup`, mutators add/remove/role |
| `process.env.REALTIME_ENABLED` được đọc cả ở wiring lẫn gateway | Gateway chỉ gọi handler; bật/tắt realtime vẫn ở wiring nhưng business không phụ thuộc |
| `ChatService` god class | Tách thành 10+ command handlers + read handlers, mỗi cái 1 trách nhiệm |
| `ChatService` phụ thuộc `UsersService` trực tiếp | `UserLookupPort` + adapter |
| Validate `body.trim()` rải rác | `MessageBodyVO` chuẩn hoá |

## 10. Những điểm "lite" cố ý giữ lại

Để không over-engineer:

- Không tạo `application/dto` riêng cho command — dùng `interface` đơn giản (giống `trip` đang làm).
- Không thêm CQRS framework (`@nestjs/cqrs`). Chỉ pattern.
- Read side dùng QueryBuilder trực tiếp trong query handler impl, không tạo riêng "read repository" interface.
- Domain events bắt đầu bằng `Noop` event bus + `@nestjs/event-emitter` cục bộ; chưa cần outbox/Kafka.
- `ChatUnitOfWork` chỉ là wrapper mỏng quanh `DataSource.transaction`, không phải full UoW.

## 11. Đề xuất tách PR

1. **PR1** — Skeleton + parity cho direct chat hiện tại: domain (Conversation/Message direct-only), ports, command/query handlers cho 4 use case cũ, mapper, repository, switch controller + gateway. Không thay đổi schema. Không thay đổi response shape.
2. **PR2** — Group chat: enum + role + member-management handlers + endpoints mới, migration thêm cột `role`/`lastReadMessageId`, factory `Conversation.createGroup`.
3. **PR3** — Read model nâng cao (`lastMessage`, `unreadCount`), edit/delete message, cursor pagination, `ChatRealtimeNotifier` đầy đủ event.
