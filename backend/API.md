# API Documentation

## Base URL
- **Development**: `http://localhost:5000`
- **Production**: `https://marketplace-backend.onrender.com`

## Authentication

Les requêtes authentifiées nécessitent un header:
```
Authorization: Bearer <token>
```

## Endpoints

### Users

#### Register
```
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "username",
  "password": "password",
  "firstName": "John",
  "lastName": "Doe"
}
```

#### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password"
}

Response:
{
  "token": "jwt-token",
  "user": { ... }
}
```

#### Get Profile
```
GET /api/users/:userId
Authorization: Bearer <token>
```

#### Update Profile
```
PUT /api/users/:userId
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "bio": "...",
  "location": "Paris",
  "avatar": "url"
}
```

### Products

#### Get All Products
```
GET /api/products?category=&sortBy=newest&page=1&limit=20
```

#### Get Product Details
```
GET /api/products/:productId
```

#### Create Product
```
POST /api/products
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "title": "Product Name",
  "description": "Description",
  "price": 99.99,
  "category": "categoryId",
  "condition": "used",
  "image": <file>
}
```

#### Update Product
```
PUT /api/products/:productId
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "...",
  "description": "...",
  "price": 99.99,
  "status": "active|sold|removed"
}
```

#### Delete Product
```
DELETE /api/products/:productId
Authorization: Bearer <token>
```

### Messages

#### Get Conversations
```
GET /api/messages/conversations
Authorization: Bearer <token>
```

#### Send Message
```
POST /api/messages
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Message text",
  "recipientId": "userId"
}
```

#### Get Messages with User
```
GET /api/messages/:userId
Authorization: Bearer <token>
```

### Categories

#### Get All Categories
```
GET /api/categories
```

#### Get Category Products
```
GET /api/categories/:categoryId/products
```

### Reviews

#### Get Product Reviews
```
GET /api/products/:productId/reviews
```

#### Create Review
```
POST /api/products/:productId/reviews
Authorization: Bearer <token>
Content-Type: application/json

{
  "rating": 5,
  "comment": "Great product!"
}
```

### Favorites

#### Get User Favorites
```
GET /api/favorites
Authorization: Bearer <token>
```

#### Add to Favorites
```
POST /api/favorites/:productId
Authorization: Bearer <token>
```

#### Remove from Favorites
```
DELETE /api/favorites/:productId
Authorization: Bearer <token>
```

## WebSocket Events

### Connection
```javascript
const socket = io('http://localhost:5000');

socket.on('connect', () => {
  socket.emit('join_room', userId);
});
```

### Send Message
```javascript
socket.emit('send_message', {
  senderId: userId,
  recipientId: recipientId,
  content: 'Message text'
});
```

### Receive Message
```javascript
socket.on('receive_message', (data) => {
  console.log('New message from', data.senderId, ':', data.content);
});
```

## Error Handling

Toutes les erreurs retournent:
```json
{
  "error": "Error message"
}
```

Codes HTTP:
- `200` OK
- `201` Created
- `400` Bad Request
- `401` Unauthorized
- `403` Forbidden
- `404` Not Found
- `500` Internal Server Error
