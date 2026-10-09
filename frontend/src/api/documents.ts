import { apiClient } from './client';

export interface Document {
  id: number;
  title: string;
  email: string;
  file: string;
  file_size: number;
  mime_type: string;
  uploaded: string;
  status: 'PENDING' | 'PROCESSING' | 'READY' | 'FAILED';
}

export const documentApi = {
  list: async () => {
    const response = await apiClient.get<Document[]>('/document/');
    return response.data;
  },
  upload: async (title: string, file: File) => {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('file', file);
    const response = await apiClient.post<Document>('/document/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  delete: async (id: number) => {
    await apiClient.delete(`/document/${id}/`);
  }
};