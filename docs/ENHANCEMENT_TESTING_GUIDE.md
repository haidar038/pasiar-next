# 🚀 Enhancement Testing Guide

## Overview

This guide covers testing all the enhancements made to improve CRUD operations, API performance, and error handling.

## Prerequisites

-   Development server running (`npm run dev`)
-   Access to WordPress backend
-   Valid authentication tokens

## 1. Testing Enhanced Update Functionality

### 1.1 Form Validation Testing

```bash
# Navigate to edit form
http://localhost:3001/kontributor/edit/cagar_budaya/[post_id]

# Test scenarios:
1. Submit form with empty title → Should show validation error
2. Submit form with very long content → Should show length validation
3. Submit form with invalid data → Should show formatted error messages
4. Submit valid form → Should show success message and redirect
```

### 1.2 API Validation Testing

```bash
# Test API directly with curl or Postman
POST /api/posts/update
Content-Type: application/json
Authorization: Bearer [your_token]

{
  "title": "",
  "userId": "user_id",
  "cptSlug": "cagar_budaya",
  "postId": 123
}
# Should return validation error with code VALIDATION_FAILED
```

### 1.3 Ownership Verification Testing

```bash
# Try to update another user's post
POST /api/posts/update
{
  "title": "Updated Title",
  "userId": "different_user_id",
  "cptSlug": "cagar_budaya",
  "postId": 123
}
# Should return 403 Forbidden
```

## 2. Testing API Endpoint Optimization

### 2.1 Health Check Testing

```bash
# Test health endpoint
GET /api/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:00:00.000Z",
  "uptime": 3600,
  "responseTime": 45,
  "services": {
    "wordpress": {
      "status": "up",
      "responseTime": 150,
      "error": null
    },
    "supabase": {
      "status": "up",
      "responseTime": 89,
      "error": null
    }
  }
}
```

### 2.2 Rate Limiting Testing

```bash
# Make multiple rapid requests
for i in {1..15}; do
  curl -X POST http://localhost:3001/api/posts/create \
    -H "Authorization: Bearer [token]" \
    -H "Content-Type: application/json" \
    -d '{"title":"Test '$i'","cptSlug":"cagar_budaya"}' &
done

# Some requests should return 429 Too Many Requests
```

### 2.3 Performance Metrics Testing

```bash
# Test metrics endpoint
GET /api/admin/metrics
Authorization: Bearer [your_token]

# Expected response includes:
{
  "success": true,
  "data": {
    "system": {
      "uptime": 3600,
      "memoryUsage": {...},
      "environment": "development"
    },
    "errors": {
      "lastHour": {...},
      "last24Hours": {...}
    },
    "api": {
      "averageResponseTime": 250,
      "totalRequests": 1500,
      "successRate": 96.5
    }
  }
}
```

### 2.4 Caching Testing

```bash
# Make same request twice - second should be faster
time curl GET /api/admin/metrics -H "Authorization: Bearer [token]"
time curl GET /api/admin/metrics -H "Authorization: Bearer [token]"
```

## 3. Testing Error Handling

### 3.1 Authentication Error Testing

```bash
# Test without token
POST /api/posts/create
# Should return 401 with proper error structure

# Test with invalid token
POST /api/posts/create
Authorization: Bearer invalid_token
# Should return 401 with proper error structure
```

### 3.2 Validation Error Testing

```bash
# Test with invalid CPT slug
POST /api/posts/create
{
  "title": "Valid Title",
  "cptSlug": "invalid@slug!"
}
# Should return 400 with validation errors array
```

### 3.3 Not Found Error Testing

```bash
# Test deleting non-existent post
POST /api/posts/delete
{
  "postId": 999999,
  "cptSlug": "cagar_budaya"
}
# Should return 404 with proper error structure
```

### 3.4 Rate Limit Error Testing

```bash
# Make rapid requests to trigger rate limit
# Should return 429 with retryable error indicator
```

## 4. Frontend Error Handling Testing

### 4.1 Network Error Simulation

```bash
# Disconnect internet while submitting form
1. Fill out form in browser
2. Disconnect internet
3. Submit form
4. Should show network error with retry option
```

### 4.2 Server Error Simulation

```bash
# Stop WordPress server temporarily
1. Stop WordPress backend
2. Try to submit form
3. Should show server error with appropriate message
```

### 4.3 Validation Error Display

```bash
# Test form validation errors
1. Submit form with empty required fields
2. Should show formatted error messages
3. Error messages should be dismissible
4. Should show retry option for retryable errors
```

## 5. Performance Testing

### 5.1 Load Testing

```bash
# Use test script
node test-enhanced-apis.mjs

# This will test:
- Health endpoint response time
- API endpoint performance
- Rate limiting effectiveness
- Error handling consistency
```

### 5.2 Memory Usage Testing

```bash
# Monitor memory usage during operations
GET /api/admin/metrics
# Check memoryUsage field for potential memory leaks
```

## 6. Integration Testing

### 6.1 Full CRUD Flow Testing

```bash
# Test complete flow:
1. Create post → Success with proper response
2. Read post → Data retrieved correctly
3. Update post → Changes saved successfully
4. Delete post → Post removed properly
```

### 6.2 User Journey Testing

```bash
# Test typical user flow:
1. Login → Authentication successful
2. Navigate to create form → Form loads properly
3. Fill and submit form → Success message shown
4. Navigate to dashboard → New post appears
5. Edit post → Form pre-populated correctly
6. Save changes → Success message and redirect
7. Delete post → Confirmation and successful deletion
```

## 7. Error Recovery Testing

### 7.1 Network Recovery

```bash
# Test automatic retry on network recovery
1. Start form submission
2. Disconnect network (triggers error)
3. Reconnect network
4. Click retry button
5. Should complete successfully
```

### 7.2 Server Recovery

```bash
# Test behavior when server recovers
1. Stop WordPress backend
2. Try to submit form (should fail)
3. Start WordPress backend
4. Retry submission
5. Should succeed
```

## Expected Results

### ✅ Success Criteria

-   All API endpoints return structured responses
-   Error messages are user-friendly and actionable
-   Rate limiting prevents abuse
-   Health checks provide accurate status
-   Form validation works consistently
-   Performance metrics are available
-   Caching reduces response times
-   Retry mechanisms work for recoverable errors

### 🔍 Monitoring

-   Check browser console for errors
-   Monitor network requests in DevTools
-   Review server logs for proper error logging
-   Verify database operations complete successfully

## Troubleshooting

### Common Issues

1. **429 Rate Limit**: Wait 1 minute and retry
2. **401 Unauthorized**: Check authentication token
3. **500 Server Error**: Check WordPress/Supabase connectivity
4. **Validation Errors**: Review form input requirements

### Debug Tools

-   Browser DevTools → Network tab
-   Server logs → Console output
-   Health endpoint → System status
-   Metrics endpoint → Performance data

## Automated Testing

Run the automated test suite:

```bash
# Start development server first
npm run dev

# Run tests in another terminal
node test-enhanced-apis.mjs
```

This will automatically test all enhancements and provide a comprehensive report.
