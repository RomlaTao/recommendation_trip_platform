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
