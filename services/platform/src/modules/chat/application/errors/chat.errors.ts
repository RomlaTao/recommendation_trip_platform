import { AppError } from '../../../../common/errors/app.error.js';

export class ChatSelfDirectError extends AppError {
  constructor() {
    super('cannot_chat_with_self', 400, 'Bad Request');
  }
}

export class ChatNotMemberError extends AppError {
  constructor() {
    super('not_a_conversation_member', 403, 'Forbidden');
  }
}

export class ChatEmptyMessageError extends AppError {
  constructor() {
    super('message_body_required', 400, 'Bad Request');
  }
}
