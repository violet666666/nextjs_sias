# Jest Test Cases Documentation - SIAS

## A. MODULE AUTHENTICATION

### Test Summary

| Test Suite | Tests | Assertions | Status |
|------------|-------|------------|--------|
| TC-01: Login email+pwd valid | 1 | 3 | ✓ |
| TC-02: Login password salah | 1 | 2 | ✓ |
| TC-03: Logout & session hapus | 1 | 2 | ✓ |
| TC-04: Register email baru | 1 | 3 | ✓ |
| TC-05: Register email duplikat | 1 | 2 | ✓ |
| TC-06: Refresh token | 3 | 6 | ✓ |
| TC-07: Verify token | 3 | 6 | ✓ |
| **Total** | **11** | **24** | |

---

### Detailed Test Cases

| TC ID | Requirement | Type | Test Case | Expected Result |
|-------|-------------|------|-----------|-----------------|
| TC-01 | FR-001 | Positive | Login dengan email & password valid | Mengembalikan JWT token dan data user |
| TC-02 | FR-001 | Negative | Login dengan password salah | Return status 401, message "Invalid email or password" |
| TC-03 | FR-002 | Positive | Logout dan hapus session | Return status 200, cookie refreshToken dihapus |
| TC-04 | FR-003 | Positive | Register email baru | Return status 201, user berhasil dibuat |
| TC-05 | FR-003 | Negative | Register email duplikat | Return status 409, message "User already exists" |
| TC-06a | FR-004 | Positive | Refresh token valid | Mengembalikan token JWT baru |
| TC-06b | FR-004 | Negative | Refresh token tidak ada | Return status 401, error "Refresh token tidak ditemukan" |
| TC-06c | FR-004 | Negative | Refresh token tidak valid | Return status 401, error "Refresh token tidak valid" |
| TC-07a | FR-005 | Positive | Verify token valid | Mengembalikan data user (id, nama, email, role) |
| TC-07b | FR-005 | Negative | Token tidak ada | Return status 401, error "Unauthorized" |
| TC-07c | FR-005 | Negative | Token tidak valid | Return status 401, error "Invalid token" |

---

### Functional Requirements Mapping

| FR ID | Requirement | Test Cases |
|-------|-------------|------------|
| FR-001 | Login dengan email dan password | TC-01, TC-02 |
| FR-002 | Logout dan hapus session | TC-03 |
| FR-003 | Registrasi user baru | TC-04, TC-05 |
| FR-004 | Refresh JWT token | TC-06a, TC-06b, TC-06c |
| FR-005 | Verifikasi JWT token | TC-07a, TC-07b, TC-07c |

---

### Expected Output (Jest)

```
A. MODULE AUTHENTICATION

TC-01: Login email+pwd valid (FR-001 - Positive)
✓ berhasil login dengan kredensial valid dan mengembalikan JWT (22 ms)

TC-02: Login password salah (FR-001 - Negative)
✓ gagal login jika password salah (4 ms)

TC-03: Logout & session hapus (FR-002 - Positive)
✓ berhasil logout dan menghapus cookie refresh token (4 ms)

TC-04: Register email baru (FR-003 - Positive)
✓ berhasil registrasi user baru (7 ms)

TC-05: Register email duplikat (FR-003 - Negative)
✓ gagal registrasi jika email duplikat (4 ms)

TC-06: Refresh token (FR-004 - Positive)
✓ berhasil generate token baru jika refresh token valid (6 ms)
✓ gagal (401) jika refresh token tidak ada (2 ms)
✓ gagal (401) jika refresh token tidak valid (66 ms)

TC-07: Verify token (FR-005 - Positive)
✓ berhasil mengembalikan data user & role jika JWT valid (2 ms)
✓ gagal (401) jika token tidak ada (1 ms)
✓ gagal (401) jika token tidak valid (2 ms)

Test Suites: 1 passed, 1 total
Tests:       11 passed, 11 total
Snapshots:   0 total
Time:        3.769 s
```

---

### Test File Location

```
src/app/api/auth/tests/auth.test.js
```

### How to Run

```bash
# Run all auth tests
npx jest src/app/api/auth/tests

# Run with verbose output
npx jest src/app/api/auth/tests --verbose

# Run with coverage
npx jest src/app/api/auth/tests --coverage
```
