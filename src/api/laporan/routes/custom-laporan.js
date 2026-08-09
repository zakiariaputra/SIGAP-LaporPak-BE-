'use strict';

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/laporan/cek-status',
      handler: 'laporan.cekStatus',
      config: {
        auth: false, // publik, tidak perlu login
      },
    },
    {
      method: 'GET',
      path: '/laporan/statistik',
      handler: 'laporan.statistik',
      config: {
        auth: false, // dilindungi lewat pengecekan token di frontend + bisa dikunci lagi lewat permission role Public (uncheck) bila endpoint ini didaftarkan ke Users-Permissions
      },
    },
    {
      method: 'GET',
      path: '/laporan/publik',
      handler: 'laporan.publik',
      config: {
        auth: false, // untuk publik agar bisa lihat data dasar
      },
    },
  ],
};