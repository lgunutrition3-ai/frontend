import api from './axios'

export const animalRaisingApi = {
  create: (data) => api.post('/ReportDataEntry/animal-raising', data),
  getByBarangay: (barangay, year) => api.get(`/ReportDataEntry/animal-raising/${barangay}/${year}`).then(res => res.data),
  getAll: () => api.get('/ReportDataEntry/animal-raising/all').then(res => res.data),
  update: (id, data) => api.put(`/ReportDataEntry/animal-raising/${id}`, data),
  delete: (id) => api.delete(`/ReportDataEntry/animal-raising/${id}`),
  deleteMany: (ids) => api.post('/ReportDataEntry/animal-raising/batch-delete', ids)
}

export const potableWaterApi = {
  create: (data) => api.post('/ReportDataEntry/potable-water', data),
  getByBarangay: (barangay, year) => api.get(`/ReportDataEntry/potable-water/${barangay}/${year}`).then(res => res.data),
  getAll: () => api.get('/ReportDataEntry/potable-water/all').then(res => res.data),
  update: (id, data) => api.put(`/ReportDataEntry/potable-water/${id}`, data),
  delete: (id) => api.delete(`/ReportDataEntry/potable-water/${id}`),
  deleteMany: (ids) => api.post('/ReportDataEntry/potable-water/batch-delete', ids)
}

export const iodizedSaltApi = {
  create: (data) => api.post('/ReportDataEntry/iodized-salt', data),
  getByBarangay: (barangay) => api.get(`/ReportDataEntry/iodized-salt/${barangay}`).then(res => res.data),
  getAll: () => api.get('/ReportDataEntry/iodized-salt/all').then(res => res.data),
  update: (id, data) => api.put(`/ReportDataEntry/iodized-salt/${id}`, data),
  delete: (id) => api.delete(`/ReportDataEntry/iodized-salt/${id}`),
  deleteMany: (ids) => api.post('/ReportDataEntry/iodized-salt/batch-delete', ids)
}

export const crApi = {
  create: (data) => api.post('/ReportDataEntry/cr', data),
  getByBarangay: (barangay, year) => api.get(`/ReportDataEntry/cr/${barangay}/${year}`).then(res => res.data),
  getAll: () => api.get('/ReportDataEntry/cr/all').then(res => res.data),
  update: (id, data) => api.put(`/ReportDataEntry/cr/${id}`, data),
  delete: (id) => api.delete(`/ReportDataEntry/cr/${id}`),
  deleteMany: (ids) => api.post('/ReportDataEntry/cr/batch-delete', ids)
}

export const backyardGardeningApi = {
  create: (data) => api.post('/ReportDataEntry/backyard-gardening', data),
  getByBarangay: (barangay, year) => api.get(`/ReportDataEntry/backyard-gardening/${barangay}/${year}`).then(res => res.data),
  getAll: () => api.get('/ReportDataEntry/backyard-gardening/all').then(res => res.data),
  update: (id, data) => api.put(`/ReportDataEntry/backyard-gardening/${id}`, data),
  delete: (id) => api.delete(`/ReportDataEntry/backyard-gardening/${id}`),
  deleteMany: (ids) => api.post('/ReportDataEntry/backyard-gardening/batch-delete', ids)
}

export const pregnantWomenApi = {
  create: (data) => api.post('/ReportDataEntry/pregnant-women', data),
  getByBarangay: (barangay, year) => api.get(`/ReportDataEntry/pregnant-women/${barangay}/${year}`).then(res => res.data),
  getAll: () => api.get('/ReportDataEntry/pregnant-women/all').then(res => res.data),
  update: (id, data) => api.put(`/ReportDataEntry/pregnant-women/${id}`, data),
  delete: (id) => api.delete(`/ReportDataEntry/pregnant-women/${id}`),
  deleteMany: (ids) => api.post('/ReportDataEntry/pregnant-women/batch-delete', ids)
}

export const vegetableSeedApi = {
  create: (data) => api.post('/ReportDataEntry/vegetable-seeds', data),
  getByBarangay: (barangay, year) => api.get(`/ReportDataEntry/vegetable-seeds/${barangay}/${year}`).then(res => res.data),
  getAll: () => api.get('/ReportDataEntry/vegetable-seeds/all').then(res => res.data),
  update: (id, data) => api.put(`/ReportDataEntry/vegetable-seeds/${id}`, data),
  delete: (id) => api.delete(`/ReportDataEntry/vegetable-seeds/${id}`),
  deleteMany: (ids) => api.post('/ReportDataEntry/vegetable-seeds/batch-delete', ids)
}

export const animalDispersalApi = {
  create: (data) => api.post('/ReportDataEntry/animal-dispersal', data),
  getByBarangay: (barangay, year) => api.get(`/ReportDataEntry/animal-dispersal/${barangay}/${year}`).then(res => res.data),
  getAll: () => api.get('/ReportDataEntry/animal-dispersal/all').then(res => res.data),
  update: (id, data) => api.put(`/ReportDataEntry/animal-dispersal/${id}`, data),
  delete: (id) => api.delete(`/ReportDataEntry/animal-dispersal/${id}`),
  deleteMany: (ids) => api.post('/ReportDataEntry/animal-dispersal/batch-delete', ids)
}