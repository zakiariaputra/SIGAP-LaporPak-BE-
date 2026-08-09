'use strict';

async function kirimEmail({ to, subject, text, html }) {
  try {
    await strapi.plugins['email'].services.email.send({
      to,
      subject,
      text,
      html,
    });
  } catch (err) {
    strapi.log.error('Gagal mengirim email:', err.message);
  }
}

const statusConfig = {
  Menunggu: {
    emoji: '🟡',
    bg: '#FEF3C7',
    color: '#92400E',
  },
  Diproses: {
    emoji: '🔵',
    bg: '#DBEAFE',
    color: '#1D4ED8',
  },
  Selesai: {
    emoji: '🟢',
    bg: '#DCFCE7',
    color: '#166534',
  },
};

module.exports = {
  async beforeCreate(event) {
    const { data } = event.params;

    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const datePart = `${yyyy}${mm}${dd}`;

    const startOfDay = new Date(`${yyyy}-${mm}-${dd}T00:00:00.000Z`);

    const countToday = await strapi.db
      .query('api::laporan.laporan')
      .count({
        where: {
          createdAt: {
            $gte: startOfDay,
          },
        },
      });

    const sequence = String(countToday + 1).padStart(4, '0');

    data.nomor_laporan = `LP-${datePart}-${sequence}`;

    if (!data.status_laporan) {
      data.status_laporan = 'Menunggu';
    }
  },

  async afterCreate(event) {
    const { result } = event;

    const currentStatus =
      statusConfig[result.status_laporan] || {
        emoji: '⚪',
        bg: '#F3F4F6',
        color: '#374151',
      };

    await kirimEmail({
      to: result.email,
      subject: `✅ Laporan Diterima - ${result.nomor_laporan}`,
      html: `
<!DOCTYPE html>
<html lang="id">

<head>
<meta charset="UTF-8">
</head>

<body style="margin:0;padding:30px;background:#f4f6f9;font-family:Arial,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td align="center">

<table width="650" cellpadding="0" cellspacing="0"
style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">

<tr>
<td style="background:#1E3A8A;padding:24px;text-align:center;color:white;">

<h1 style="margin:0;font-size:24px;">
SIGAP LaporPak
</h1>

<p style="margin-top:8px;font-size:14px;">
Sistem Informasi Pelaporan Kerusakan Fasilitas Sekolah
</p>

</td>
</tr>

<tr>
<td style="padding:32px;">

<h2 style="margin-top:0;color:#111827;">
Halo, ${result.nama_pelapor} 👋
</h2>

<p style="font-size:15px;color:#374151;line-height:1.7;">
Laporan kerusakan yang Anda kirim telah berhasil diterima oleh sistem.
</p>

<div style="
background:#EEF4FF;
border-left:5px solid #1E3A8A;
padding:16px;
margin:25px 0;
">

<div style="font-size:13px;color:#6b7280;">
Nomor Laporan
</div>

<div style="
font-size:24px;
font-weight:bold;
color:#1E3A8A;
margin-top:4px;
">
${result.nomor_laporan}
</div>

</div>

<table width="100%" cellpadding="10" cellspacing="0"
style="border-collapse:collapse;">

<tr style="border-bottom:1px solid #eee;">
<td width="180"><strong>Status</strong></td>
<td>

<span style="
background:${currentStatus.bg};
color:${currentStatus.color};
padding:6px 14px;
border-radius:20px;
font-weight:bold;
">
${currentStatus.emoji} ${result.status_laporan}
</span>

</td>
</tr>

<tr style="border-bottom:1px solid #eee;">
<td><strong>Lokasi</strong></td>
<td>${result.lokasi}</td>
</tr>

<tr style="border-bottom:1px solid #eee;">
<td><strong>Barang/Fasilitas</strong></td>
<td>${result.nama_barang}</td>
</tr>

<tr style="border-bottom:1px solid #eee;">
<td><strong>Tanggal Lapor</strong></td>
<td>${new Date(result.createdAt).toLocaleDateString('id-ID')}</td>
</tr>

<tr>
<td valign="top"><strong>Deskripsi</strong></td>
<td>

<div style="
background:#F8FAFC;
padding:12px;
border-radius:8px;
border:1px solid #E5E7EB;
">

${result.deskripsi}

</div>

</td>
</tr>

</table>

<div style="
margin-top:30px;
padding:18px;
background:#ECFDF5;
border-left:5px solid #10B981;
">

<strong>✔ Simpan Nomor Laporan Anda</strong>

<p style="margin-bottom:0;">
Gunakan nomor laporan di atas untuk melihat perkembangan status laporan pada halaman
<b>Cek Status</b>.
</p>

</div>

</td>
</tr>

<tr>
<td style="
background:#F3F4F6;
padding:20px;
text-align:center;
font-size:13px;
color:#6B7280;
">

Email ini dikirim otomatis oleh sistem <b>SIGAP LaporPak</b>.<br>
Mohon tidak membalas email ini.

</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>
`,
    });
  },

    async beforeUpdate(event) {
    const { where, data } = event.params;

    const existing = await strapi.db
      .query('api::laporan.laporan')
      .findOne({ where });

    event.state.previousStatus = existing?.status_laporan;
    event.state.previousCatatan = existing?.catatan_admin;

    if (
      data.status_laporan === 'Selesai' &&
      !data.tanggal_selesai
    ) {
      data.tanggal_selesai = new Date();
    }
  },

  async afterUpdate(event) {
    const { result, state } = event;

    const previousStatus =
      statusConfig[state.previousStatus] || {
        emoji: '⚪',
        bg: '#F3F4F6',
        color: '#374151',
      };

    const currentStatus =
      statusConfig[result.status_laporan] || {
        emoji: '⚪',
        bg: '#F3F4F6',
        color: '#374151',
      };

    const statusBerubah =
      state.previousStatus &&
      result.status_laporan !== state.previousStatus;

    const catatanBerubah =
      result.catatan_admin &&
      result.catatan_admin !== state.previousCatatan;

    if (!statusBerubah && !catatanBerubah) return;

    await kirimEmail({
      to: result.email,
      subject: `🔔 Update Laporan - ${result.nomor_laporan}`,
      html: `
<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
</head>

<body style="margin:0;padding:30px;background:#f4f6f9;font-family:Arial,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td align="center">

<table width="650" cellpadding="0" cellspacing="0"
style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">

<tr>
<td style="background:#1E3A8A;padding:24px;text-align:center;color:white;">

<h1 style="margin:0;">SIGAP LaporPak</h1>

<p style="margin-top:8px;font-size:14px;">
Update Status Laporan Kerusakan
</p>

</td>
</tr>

<tr>
<td style="padding:32px;">

<h2 style="margin-top:0;color:#111827;">
Halo, ${result.nama_pelapor} 👋
</h2>

<p style="font-size:15px;color:#374151;line-height:1.7;">
Ada pembaruan pada laporan yang pernah Anda kirim.
</p>

<div style="
background:#EEF4FF;
border-left:5px solid #1E3A8A;
padding:16px;
margin:25px 0;
">

<div style="font-size:13px;color:#6B7280;">
Nomor Laporan
</div>

<div style="
font-size:24px;
font-weight:bold;
color:#1E3A8A;
margin-top:5px;
">
${result.nomor_laporan}
</div>

</div>

<h3 style="margin-bottom:16px;">
📝 Perubahan Status
</h3>

<table width="100%" cellpadding="8" cellspacing="0">

<tr>
<td><strong>Status Sebelumnya</strong></td>
<td>

<span style="
background:${previousStatus.bg};
color:${previousStatus.color};
padding:6px 14px;
border-radius:20px;
font-weight:bold;
">
${previousStatus.emoji} ${state.previousStatus}
</span>

</td>
</tr>

<tr>
<td></td>
<td style="font-size:28px;padding:10px 0;">
⬇️
</td>
</tr>

<tr>
<td><strong>Status Sekarang</strong></td>
<td>

<span style="
background:${currentStatus.bg};
color:${currentStatus.color};
padding:6px 14px;
border-radius:20px;
font-weight:bold;
">
${currentStatus.emoji} ${result.status_laporan}
</span>

</td>
</tr>

</table>

<table width="100%" cellpadding="10" cellspacing="0"
style="border-collapse:collapse;">

<tr style="border-bottom:1px solid #eee;">
<td width="170"><strong>Status Sebelumnya</strong></td>
<td>${state.previousStatus ?? '-'}</td>
</tr>

<tr style="border-bottom:1px solid #eee;">
<td><strong>Status Sekarang</strong></td>
<td>

<span style="
background:${currentStatus.bg};
color:${currentStatus.color};
padding:6px 14px;
border-radius:20px;
font-weight:bold;
">
${currentStatus.emoji} ${result.status_laporan}
</span>

</td>
</tr>

${
  result.catatan_admin
    ? `
<tr>
<td valign="top"><strong>Catatan Admin</strong></td>
<td>

<div style="
background:#F9FAFB;
border:1px solid #E5E7EB;
padding:14px;
border-radius:8px;
line-height:1.6;
">

${result.catatan_admin}

</div>

</td>
</tr>
`
    : ''
}

</table>

<div style="
margin-top:28px;
padding:18px;
background:#ECFDF5;
border-left:5px solid #10B981;
">

<strong>📢 Informasi</strong>

<p style="margin-bottom:0;line-height:1.7;">
Silakan buka halaman <b>Cek Status</b> untuk melihat perkembangan terbaru dari laporan Anda.
</p>

</div>

</td>
</tr>

<tr>
<td style="
background:#F3F4F6;
padding:20px;
text-align:center;
font-size:13px;
color:#6B7280;
">

Email ini dikirim otomatis oleh <b>SIGAP LaporPak</b>.<br>
Mohon tidak membalas email ini.

</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>
`,
    });
  },
};