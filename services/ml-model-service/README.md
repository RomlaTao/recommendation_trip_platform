# Tài liệu thiết kế kiến trúc: ML Model Service

Tài liệu mô tả kiến trúc **ML Model Service** — microservice Python (FastAPI), độc lập triển khai, phụ trách scoring / gợi ý địa điểm. Service giao tiếp với **platform** (NestJS, `services/platform`) theo mô hình **hybrid: gRPC + message broker (RabbitMQ)**.

---

## Tích hợp với platform

### Cơ sở dữ liệu riêng và đồng bộ sự kiện

- ML service có **PostgreSQL riêng** (schema và vòng đời migration tách biệt platform).
- **Không** coi DB platform là nguồn đọc trực tiếp cho nghiệp vụ ML. Dữ liệu phục vụ ranking / feature store (bản ML) được **đồng bộ** qua luồng sự kiện.
- **RabbitMQ:** mọi thay đổi có ý nghĩa trong **Place Module** trên platform đều **publish event**; ML service **consume** và cập nhật projection / bảng đọc phục vụ inference (idempotent consumer, có thể retry theo chính sách dead-letter tùy triển khai).

### Giao tiếp hybrid (gRPC + RabbitMQ)

| Kênh | Vai trò gợi ý |
|------|----------------|
| **RabbitMQ** | Đồng bộ trạng thái dài hạn (place created/updated/deleted, metadata phục vụ ML), giảm coupling thời gian thực, chịu spike ghi. |
| **gRPC** | Giao tiếp đồng bộ, hợp đồng kiểu chặt: truy vấn inference theo request/response, health, hoặc RPC nội bộ platform → ML (hoặc hai chiều tùy bounded context). |

Hai kênh bổ trợ nhau: broker cho **chuỗi sự kiện và eventual consistency**; gRPC cho **latency thấp và contract rõ** khi cần kết quả ngay trong luồng xử lý.

---

## 1. Tổng quan kiến trúc phân lớp (Layered Architecture)

Hệ thống tuân thủ hướng **Clean Architecture**, tách phần giao tiếp mạng / message / persistence khỏi use case và tầng ML:

- **API Layer (Presentation):** HTTP (FastAPI/Starlette), routing, validate đầu vào bằng Pydantic. Không chứa logic training/inference thuần ML.
- **Service Layer (Use Case):** Điều phối: đọc projection từ DB ML, gọi ML Engine, tùy case gọi port outbound (gRPC client tới platform nếu có).
- **ML Engine Layer (Core):** Feature engineering, load model, inference (predict / ranking).
- **Infrastructure Layer:** PostgreSQL (DB ML), consumer/producer **RabbitMQ**, server/client **gRPC**, Redis (cache tùy chọn), cấu hình runtime.

---

## 2. Luồng dữ liệu tóm tắt (Place → ML)

1. Platform (Place Module) thực hiện thay đổi domain → publish event lên RabbitMQ (routing key / exchange theo convention dự án).
2. ML consumer nhận event → map payload → upsert vào DB ML (hoặc queue xử lý nền) để giữ **read model** / feature phục vụ inference nhất quán với platform về mặt nghiệp vụ, không chia sẻ cùng instance DB với Nest.

---

## 3. Cấu trúc thư mục (gợi ý)

```text
ml-model-service/
├── app/
│   ├── api/                           # [API Layer] HTTP router & dependencies
│   │   ├── dependencies.py
│   │   └── v1/
│   │       └── itinerary_router.py
│   │
│   ├── grpc/                          # [gRPC] Servicer implementation & stubs (generated)
│   │   └── ...
│   │
│   ├── messaging/                     # [RabbitMQ] Consumers, publishers, serializers
│   │   └── place_events_consumer.py
│   │
│   ├── schemas/                       # [DTOs] Pydantic (HTTP + message payload nội bộ)
│   │   ├── itinerary_req.py
│   │   └── itinerary_res.py
│   │
│   ├── services/                      # [Use cases]
│   │   └── recommendation_service.py
│   │
│   ├── ml_core/                       # [ML Engine]
│   │   ├── exceptions.py
│   │   ├── feature_engineering/
│   │   │   └── preprocessor.py
│   │   ├── models/
│   │   │   ├── base_model.py
│   │   │   └── ranking_model.py
│   │   └── registry/
│   │       └── model_v1_final.pkl    # Trọng số (có thể chuyển sang artifact store sau)
│   │
│   ├── infra/                         # [Infrastructure]
│   │   ├── redis_client.py           # Tùy chọn
│   │   ├── db/                       # Session, repository cho DB ML
│   │   ├── rabbitmq.py
│   │   └── grpc_channel.py           # Client tới platform nếu cần
│   │
│   ├── core/                          # Config, logging, lifespan (startup: consumer + grpc server)
│   │   ├── config.py
│   │   └── lifespan.py
│   │
│   └── main.py                        # FastAPI + mount khởi động song song consumer/gRPC nếu thiết kế process đơn
│
├── requirements.txt
└── Dockerfile
```

---

## 4. Phạm vi tài liệu

Các chủ đề vận hành khác (bảo mật chi tiết, versioning model artifact, multi-region, v.v.) **tạm không mở rộng** trong tài liệu này; sẽ bổ sung khi triển khai từng phần.

---

## 5. API contract

Cấu trúc JSON Payload từ Platform gửi lên ML-Model-Service

```text
{
  "user_context": {
    "user_id": "usr_98765"
  },
  "trip_context": {
    "region_id": "vungtauCity",
    "current_time": "2026-05-14T14:30:00Z",
    "last_location": {
      "latitude": 10.3459,
      "longitude": 107.0843
    },
    "draft_route_ids": [
      "loc_001",
      "loc_045"
    ]
  },
  "constraints": {
    "radius_km": 5.0,
    "top_k": 10,
    "category_filter": ["cafe", "restaurant"]
  }
}
```

Cấu trúc JSON Payload từ ML-Model-Service trả về Platform

```text
{
  "recommendations": [
    {
      "location_id": "loc_089",
      "score": 0.95,
      "distance_km": 1.2
    },
    {
      "location_id": "loc_102",
      "score": 0.88,
      "distance_km": 3.5
    }
  ],
  "metadata": {
    "model_version": "v1.2.0-sequence-cf",
    "inference_time_ms": 42,
    "candidates_scored": 350
  }
}
```

---

## 6. Hiện thực mock (khung dự án)

- **HTTP:** `POST /api/v1/itinerary/recommendations` — body/response khớp mục §5 (Pydantic).
- **Ranking mock:** tín hiệu `popular = rating × review_count`, `distance_km` (Haversine), `tag_similar` (Jaccard giữa `category_filter` và tag địa điểm; nếu không lọc category thì hệ số trung tính). Trọng số tổ hợp cố định trong `app/ml_core/models/ranking_model.py`.
- **Dữ liệu:** danh sách địa điểm giả lập trong bộ nhớ (`recommendation_service`) cho đến khi RabbitMQ + DB ML được nối.

### Chạy local

```bash
cd services/ml-model-service
python -m venv .venv
# Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

- OpenAPI: `http://127.0.0.1:8001/docs`
- Health: `GET http://127.0.0.1:8001/health`

### Docker

```bash
cd services/ml-model-service
docker build -t ml-model-service:local .
docker run --rm -p 8001:8001 ml-model-service:local
```

Từ **gốc monorepo**:

```bash
docker compose up -d postgres-platform postgres-ml redis rabbitmq ml-model-service
# Platform DB: localhost:5432  |  ML DB: localhost:5433  |  ML API: http://127.0.0.1:8001/docs
# Hai Postgres độc lập (`postgres-platform`, `postgres-ml`); ML dùng init `docker/postgres/ml-init/`.
# Compose mount `./dataset` → `/app/dataset`; khi `ML_SEED_ON_START=true` (mặc định), lúc start ML upsert CSV vào `place_features_projection` và `category_projection`.
# Trong compose: ML_DB_HOST=postgres-ml, RABBITMQ_HOST=rabbitmq; user/pass lấy từ root `.env` (ML_DB_* / PLATFORM_DB_*).
```

---

## 7. Kế hoạch từng bước

Kế hoạch dưới đây **khớp với mục §5 (contract JSON)**, **§6 (HTTP hiện có)** và các điểm đã thống nhất: **HTTP làm inference trước**, **gRPC sau**; **định danh địa điểm = UUID** giống catalog platform; **outbox + RabbitMQ** cho đồng bộ projection; **fallback catalog qua tầng application**, không couple thẳng repository.

### Lộ trình giao tiếp (đồng bộ với mục mở đầu)

| Giai đoạn | Inference (Platform → ML) | Ghi chú |
|-----------|---------------------------|---------|
| **1** | **HTTP** — `POST /api/v1/itinerary/recommendations` (§6) | Giữ nguyên route; body/response map 1-1 với Pydantic `ItineraryRecommendationRequest` / `ItineraryRecommendationResponse`. |
| **2** (tùy chọn) | **gRPC** song song hoặc thay HTTP | Khi cần contract `.proto` chặt / latency thấp hơn; platform gọi client gRPC nội bộ. |

**Đồng bộ dữ liệu (eventual consistency)** luôn qua **RabbitMQ** như §2; ML **không** đọc DB platform cho nghiệp vụ ranking, chỉ đọc **DB ML (projection)** sau Phần 2.

### Định danh trong JSON (§5)

- **`location_id` trong response** = **`places.id`** (UUID) trên platform, **không** dùng prefix kiểu `loc_*` trong tích hợp thật (ví dụ §5 chỉ minh họa).
- **`draft_route_ids`** (nếu có) = danh sách **UUID place** đã có trong lộ trình nháp; ML có thể dùng để trừ trùng / boost liên quan khi mở rộng schema (vẫn nằm trong `trip_context` của cùng contract §5).

---

### Phần 1 — Cầu nối dữ liệu (Platform `services/platform` → RabbitMQ)

**Mục tiêu:** đẩy thay đổi Place (và tín hiệu phục vụ ML) **chủ động** từ platform; ML không gọi ngược catalog để “bơm” toàn bộ catalogue.

#### 1.1 Transactional Outbox (NestJS)

- Entity ví dụ **`OutboxEventOrmEntity`**: tối thiểu `id`, **`event_type`**, **`payload` (JSONB)**, **`status`** (`PENDING` / `PUBLISHED` / `FAILED`), **`created_at`**; nên thêm **`aggregate_type`**, **`aggregate_id`**, **`event_id`** (hoặc dedup key) để relay và consumer **idempotent**.
- **Ghi outbox trong cùng transaction** với thay đổi nghiệp vụ: dùng **`QueryRunner`** / `EntityManager` transaction — khi commit `places` (hoặc trường liên quan ML), một dòng outbox được commit cùng lúc.

#### 1.2 Phạm vi sự kiện (bắt buộc liệt kê khi implement)

Projection ML cần bám các thay đổi có ý nghĩa, ví dụ:

- **Vòng đời / nội dung place:** tạo/cập nhật sau duyệt, đổi status, soft-delete / restore (management).
- **Tín hiệu xếp hạng:** cập nhật **`average_rating`**, **`review_count`**, (và metadata liên quan) sau khi **đã ghi xuống DB platform** — kể cả khi đường nội bộ hiện tại đi qua **Bull** cho review/rating: outbox phải gắn tại **ranh giới ghi DB cuối cùng** (sau khi aggregate `places` nhất quán), không chỉ dựa vào log event bus in-process hiện tại.

#### 1.3 Outbox Relay Worker

- Worker (cron hoặc process riêng) đọc **`PENDING`**, publish lên **RabbitMQ** (ví dụ exchange `place.events.exchange`, routing key theo `event_type`).
- **Nhiều instance:** dùng pattern **`SELECT … FOR UPDATE SKIP LOCKED`** (hoặc tương đương) để tránh hai worker publish cùng một dòng.
- Sau publish thành công: **`PUBLISHED`** hoặc xóa bản ghi; retry/backoff khi broker lỗi; dead-letter tùy chính sách vận hành.

---

### Phần 2 — Đồng bộ & lưu trữ tại `ml-model-service`

**Mục tiêu:** consumer Python xây **projection** trên **PostgreSQL riêng** của ML (migration nên đặt dưới `app/infra/db/`, ví dụ **Alembic** — khớp §3).

#### 2.1 Bảng gợi ý: `place_features_projection`

- **`place_id` (UUID, PK)**, `lat`, `lng`, `category_id`, `average_rating`, `review_count`, `status` (hoặc cờ catalog-equivalent), cột **`features` JSONB** (tag scores / vector tùy bài toán).
- **UPSERT** theo `place_id` từ payload event; consumer **idempotent** (at-least-once delivery).

#### 2.2 RabbitMQ consumer (Python)

- Ví dụ **aio-pika** (async cùng FastAPI) hoặc worker tách process; bind queue (ví dụ `place_events_queue`) vào exchange §1.3.
- Khởi động trong **`lifespan`** (§3) hoặc process companion — tùy chọn triển khai một pod hai container vs một process.

---

### Phần 3 — Inference engine (HTTP trước; cache tùy chọn)

#### 3.1 Endpoint và schema

- **Giữ endpoint §6:** `POST /api/v1/itinerary/recommendations`.
- **Input / output** chính thức là schema Pydantic hiện có — **map trực tiếp** với ví dụ JSON §5:
  - `user_context` ↔ `user_id`, …
  - `trip_context` ↔ `region_id`, `current_time`, `last_location`, `draft_route_ids`
  - `constraints` ↔ `radius_km`, `top_k`, `category_filter`  
  Mọi mở rộng (time window, tag ưu tiên) = **phiên bản contract** hoặc field optional có version.

#### 3.2 Redis (optional, sau khi DB projection ổn định)

- **Cache key:** nên **chuẩn hóa** payload trước khi hash (ví dụ làm tròn tọa độ theo lưới, sắp xếp key JSON, bỏ field không ảnh hưởng ranking) để tăng hit rate; tránh hash thô toàn bộ JSON nếu client gửi thứ tự field khác nhau.
- **TTL** (ví dụ 10–30 phút): cân nhắc **độ “fresh”** — sau khi có event place mới, kết quả cache có thể trễ tối đa một TTL trừ khi có **invalidation** theo `event_id` / `place_id` (nâng cao).

#### 3.3 Lọc candidate từ projection

- Query `place_features_projection` theo **bán kính** quanh `trip_context.last_location` và `constraints`.
- **MVP:** lọc bằng **Haversine** trong SQL hoặc trong app (đủ cho khối lượng vừa).
- **Nâng cao:** **PostGIS** + index không gian khi dữ liệu và truy vấn tăng (bật extension, vận hành rõ ràng).

---

### Phần 4 — Artifact mô hình thật (`ml_core`)

- Thay **`MockRankingModel`** / mock catalogue in-memory bằng pipeline **feature (request + projection) → model → score → top_k**.
- **`lifespan`:** với artifact **nhỏ** (pickle nhẹ): preload một lần; với **ONNX / Torch lớn**: cân nhắc **lazy load**, worker riêng, hoặc mmap — tránh chặn startup API quá lâu.
- **`metadata.model_version`** (§5) phản ánh version artifact thật.

---

### Phần 5 — Chịu lỗi trên platform

- Gọi ML qua mạng **luôn ẩn chứa rủi ro** — platform cần **timeout cứng** (ví dụ 500ms–2s tùy SLA, có thể cao hơn 500ms nếu cold start chấp nhận được), **retry có giới hạn**, **circuit breaker** (ví dụ `@nestjs/axios` + axios-retry hoặc thư viện CB tương đương).
- **Fallback:** khi ML timeout / lỗi / CB mở — gọi **`PlaceCatalogService`** (hoặc **port application** tương đương: nearby / search đã có sẵn), **không** import trực tiếp `PlaceCatalogRepository` từ controller/use case lạ để tránh coupling xấu giữa bounded context.
- Kết quả fallback: danh sách địa điểm vẫn có (ví dụ nearby + sort theo rating/khoảng cách), thiếu phần “cá nhân hóa sâu” từ ML.

---

### Thứ tự triển khai gợi ý (tóm tắt)

1. Outbox + relay + RabbitMQ (Phần 1) — đủ loại event cho projection.  
2. DB ML + consumer + UPSERT (Phần 2).  
3. Nối inference HTTP đọc projection, bỏ mock in-memory (Phần 3).  
4. Redis cache (tùy chọn) và tinh chỉnh query (Haversine → PostGIS nếu cần).  
5. Thay mock ranker bằng artifact thật (Phần 4).  
6. gRPC inference (bảng lộ trình đầu §7) và hardening platform (Phần 5) song song hoặc sau bước 3 tùy ưu tiên.