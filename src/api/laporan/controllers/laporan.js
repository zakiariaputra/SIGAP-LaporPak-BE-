'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::laporan.laporan', ({ strapi }) => ({

  // endpoint custom: cek status publik, hanya field terbatas
  async cekStatus(ctx) {
    const { nomor_laporan } = ctx.query;

    if (!nomor_laporan) {
      return ctx.badRequest('Parameter nomor_laporan wajib diisi.');
    }

    const laporan = await strapi.db.query('api::laporan.laporan').findOne({
      where: { nomor_laporan, is_archived: false },
      select: [
        'nomor_laporan',
        'lokasi',
        'nama_barang',
        'deskripsi',
        'status_laporan',
        'catatan_admin',
        'createdAt',
        'tanggal_selesai',
      ],
      populate: ['foto', 'foto_dari_admin'],
    });

    if (!laporan) {
      return ctx.notFound('Laporan tidak ditemukan. Periksa kembali nomor laporan.');
    }

    return { data: laporan };
  },

  // data yg boleh dilihat public
  async publik(ctx) {
    const laporans = await strapi.db.query('api::laporan.laporan').findMany({
      where: { is_archived: false },
      select: ['nomor_laporan', 'lokasi', 'nama_barang', 'status_laporan', 'createdAt'],
      orderBy: { createdAt: 'desc' },
      limit: 10,
    });

    return { data: laporans };
  },

  // endpoint custom: statistik untuk kartu ringkasan di dashboard admin
  async statistik(ctx) {
    const baseWhere = { is_archived: false };

    const [total, menunggu, diproses, selesai] = await Promise.all([
      strapi.db.query('api::laporan.laporan').count({ where: baseWhere }),
      strapi.db.query('api::laporan.laporan').count({ where: { ...baseWhere, status_laporan: 'Menunggu' } }),
      strapi.db.query('api::laporan.laporan').count({ where: { ...baseWhere, status_laporan: 'Diproses' } }),
      strapi.db.query('api::laporan.laporan').count({ where: { ...baseWhere, status_laporan: 'Selesai' } }),
    ]);

    return { data: { total, menunggu, diproses, selesai } };
  },

}));