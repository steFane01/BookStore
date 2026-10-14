/**
 * SameDay EasyBox locații — România.
 *
 * Listă de rezervă (fallback) folosită când contul SameDay nu este configurat
 * sau serviciul este indisponibil. În mod normal backend-ul interoghează API-ul
 * SameDay live prin `../sameday.js` (see `getLockers()`), iar această listă este
 * servită doar ca plan B, marcat `source: 'static'`.
 *
 * Fiecare entry: { id, city, name, address, region? }
 */

export const EASYBOXES = [
  // București
  { id: 'EB-BUC-001', city: 'București', name: 'EasyBox Sector 1 — Victoriei', address: 'Calea Victoriei 120, București', lat: 44.4506, lng: 26.0865 },
  { id: 'EB-BUC-002', city: 'București', name: 'EasyBox Sector 2 — Obor', address: 'Șos. Mihai Bravu 4, București', lat: 44.4484, lng: 26.1271 },
  { id: 'EB-BUC-003', city: 'București', name: 'EasyBox Sector 3 — Unirii', address: 'Piața Unirii 1, București', lat: 44.427, lng: 26.1018 },
  { id: 'EB-BUC-004', city: 'București', name: 'EasyBox Sector 4 — Berceni', address: 'Bd. Constantin Brâncoveanu 3, București', lat: 44.3971, lng: 26.119 },
  { id: 'EB-BUC-005', city: 'București', name: 'EasyBox Sector 6 — Drumul Taberei', address: 'Bd. Drumul Taberei 44, București', lat: 44.4541, lng: 26.0221 },
  // Ilfov
  { id: 'EB-IF-001', city: 'Ilfov', name: 'EasyBox Bragadiru — Centru', address: 'Str. Școlii 1, Bragadiru, Ilfov', lat: 44.3708, lng: 25.9735 },
  { id: 'EB-IF-002', city: 'Ilfov', name: 'EasyBox Otopeni — Aeroport', address: 'Calea Bucureștilor 224, Otopeni, Ilfov', lat: 44.5491, lng: 26.0695 },
  // Cluj-Napoca
  { id: 'EB-CL-001', city: 'Cluj-Napoca', name: 'EasyBox Cluj — Mărăști', address: 'Str. Câmpului 60, Cluj-Napoca', lat: 46.7752, lng: 23.6052 },
  { id: 'EB-CL-002', city: 'Cluj-Napoca', name: 'EasyBox Cluj — Centru', address: 'Str. Avram Iancu 8, Cluj-Napoca', lat: 46.7701, lng: 23.5891 },
  // Timișoara
  { id: 'EB-TM-001', city: 'Timișoara', name: 'EasyBox Timișoara — Centru', address: 'Str. Eroilor de la Tisa 7, Timișoara', lat: 45.7494, lng: 21.2273 },
  { id: 'EB-TM-002', city: 'Timișoara', name: 'EasyBox Timișoara — Iosefin', address: 'Bd. Republicii 7, Timișoara', lat: 45.7412, lng: 21.2051 },
  // Iași
  { id: 'EB-IS-001', city: 'Iași', name: 'EasyBox Iași — Palas', address: 'Bd. Ștefan cel Mare 8, Iași', lat: 47.1571, lng: 27.5873 },
  { id: 'EB-IS-002', city: 'Iași', name: 'EasyBox Iași — Tudor', address: 'Bd. Tudor Vladimirescu 20, Iași', lat: 47.1872, lng: 27.5621 },
  // Constanța
  { id: 'EB-CB-001', city: 'Constanța', name: 'EasyBox Constanța — Centru', address: 'Bd. Tomis 96, Constanța', lat: 44.1733, lng: 28.6381 },
  { id: 'EB-CB-002', city: 'Constanța', name: 'EasyBox Constanța — City Park', address: 'Bd. Alexandru Lăpușneanu 116C, Constanța', lat: 44.1931, lng: 28.6622 },
  // Oradea
  { id: 'EB-BH-001', city: 'Oradea', name: 'EasyBox Oradea — Centru', address: 'Str. Republicii 20, Oradea', lat: 47.0568, lng: 21.9201 },
  // Brașov
  { id: 'EB-BV-001', city: 'Brașov', name: 'EasyBox Brașov — Centru', address: 'Str. Mureșenilor 12, Brașov', lat: 45.6428, lng: 25.5887 },
  // Pitești
  { id: 'EB-AG-001', city: 'Pitești', name: 'EasyBox Pitești — Centru', address: 'Bd. Republicii 37, Pitești', lat: 44.8565, lng: 24.8693 },
  // Craiova
  { id: 'EB-DJ-001', city: 'Craiova', name: 'EasyBox Craiova — Centru', address: 'Str. Alexandru Ioan Cuza 14, Craiova', lat: 44.3301, lng: 23.7949 },
  // Galați
  { id: 'EB-GL-001', city: 'Galați', name: 'EasyBox Galați — Centru', address: 'Str. Domnească 87, Galați', lat: 45.4354, lng: 28.0087 },
  // Sibiu
  { id: 'EB-SB-001', city: 'Sibiu', name: 'EasyBox Sibiu — Centru', address: 'Str. Nicolae Bălcescu 21, Sibiu', lat: 45.7962, lng: 24.1472 },
  // Botoșani
  { id: 'EB-BT-001', city: 'Botoșani', name: 'EasyBox Botoșani — Centru', address: 'Str. Marchian 15, Botoșani', lat: 47.7488, lng: 26.6592 },
  // Târgu Mureș
  { id: 'EB-MS-001', city: 'Târgu Mureș', name: 'EasyBox Târgu Mureș — Centru', address: 'Piața Trandafirilor 40, Târgu Mureș', lat: 46.5456, lng: 24.5575 },
  // Satu Mare
  { id: 'EB-SM-001', city: 'Satu Mare', name: 'EasyBox Satu Mare — Centru', address: 'Bd. Henri Coandă 4, Satu Mare', lat: 47.7939, lng: 22.8802 },
  // Miercurea Ciuc
  { id: 'EB-HR-001', city: 'Miercurea Ciuc', name: 'EasyBox Miercurea Ciuc — Centru', address: 'Piața Libertății 5, Miercurea Ciuc', lat: 46.3591, lng: 25.8011 },
]

/** Helpers for the checkout + email. */
export function findEasybox(id) {
  return EASYBOXES.find((e) => e.id === id) || null
}

export function easyboxLabel(e) {
  if (!e) return ''
  return `${e.name} — ${e.address}`
}
