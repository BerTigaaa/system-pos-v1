## Development Workflow

Setelah selesai development setiap fitur, WAJIB melakukan **pentesting** (pengujian penetrasi) untuk:

1. Memastikan code berjalan sesuai spesifikasi
2. Meminimalisir temuan bug di kemudian hari
3. Menjaga kualitas code

### Tahapan Pentesting

1. **Functional Testing** — uji semua fitur sesuai spesifikasi
2. **Security Testing** — periksa celah keamanan (auth bypass, SQL injection, XSS, CSRF, privilege escalation)
3. **Edge Case Testing** — uji dengan data tidak terduga (input kosong, karakter khusus, nilai negatif, volume besar)
4. **Integration Testing** — pastikan integrasi antar modul tidak rusak
5. **Regression Testing** — pastikan fitur lama tetap berfungsi
6. **Performance Check** — pastikan response time wajar, tidak ada memory leak

### Checklist Pentesting

- [ ] Test semua endpoint API dengan payload valid & invalid
- [ ] Test role-based access control (setiap role hanya bisa akses sesuai permission)
- [ ] Test error handling (error message tidak boleh bocor informasi sensitif)
- [ ] Test form validation (client-side & server-side)
- [ ] Test database constraint & relation integrity
- [ ] Test dark mode / responsive layout
- [ ] Test dengan data kosong (empty state)
- [ ] Catat semua temuan & perbaiki sebelum lanjut ke fitur berikutnya

### Pelaporan

Buat catatan temuan di file `plan/pentesting-{fitur}.md` untuk setiap sesi pentesting.
