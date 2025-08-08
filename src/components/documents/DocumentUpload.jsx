import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useQuery, useMutation } from 'react-query';
import { toast } from 'react-hot-toast';
import { FiUpload, FiX, FiFile, FiCalendar, FiUser } from 'react-icons/fi';
import { documentsAPI, athletesAPI } from '../../services/api';

function DocumentUpload({ athleteId, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    athleteId: athleteId || '',
    typeId: '',
    issueDate: '',
    expiryDate: '',
    notes: ''
  });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Recupera lista atleti per selezione
  const { data: athletesData } = useQuery('athletes-select', 
    () => athletesAPI.getAthletes({ limit: 1000 })
  );

  // Recupera tipi di documento
  const { data: documentTypes } = useQuery('document-types',
    () => documentsAPI.getDocumentTypes()
  );

  // Upload mutation
  const uploadMutation = useMutation(
    (data) => documentsAPI.uploadDocument(data),
    {
      onSuccess: () => {
        onSuccess();
        onClose();
      },
      onError: (error) => {
        toast.error(error.message || 'Errore nel caricamento del documento');
        setUploading(false);
      }
    }
  );

  // Dropzone configuration
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const uploadedFile = acceptedFiles[0];
      
      // Verifica dimensione (max 10MB)
      if (uploadedFile.size > 10 * 1024 * 1024) {
        toast.error('Il file è troppo grande. Dimensione massima: 10MB');
        return;
      }
      
      setFile(uploadedFile);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1,
    multiple: false
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      toast.error('Seleziona un file da caricare');
      return;
    }
    
    if (!formData.athleteId) {
      toast.error('Seleziona un atleta');
      return;
    }
    
    if (!formData.typeId) {
      toast.error('Seleziona il tipo di documento');
      return;
    }

    setUploading(true);

    const uploadData = new FormData();
    uploadData.append('file', file);
    uploadData.append('athleteId', formData.athleteId);
    uploadData.append('typeId', formData.typeId);
    if (formData.issueDate) uploadData.append('issueDate', formData.issueDate);
    if (formData.expiryDate) uploadData.append('expiryDate', formData.expiryDate);
    if (formData.notes) uploadData.append('notes', formData.notes);

    uploadMutation.mutate(uploadData);
  };

  const athletes = athletesData?.data?.athletes || [];
  const types = documentTypes?.data || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Carica Nuovo Documento</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FiX className="text-2xl" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Selezione Atleta */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FiUser className="inline mr-1" />
              Atleta *
            </label>
            <select
              value={formData.athleteId}
              onChange={(e) => setFormData({ ...formData, athleteId: e.target.value })}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
              disabled={athleteId}
            >
              <option value="">Seleziona un atleta...</option>
              {athletes.map((athlete) => (
                <option key={athlete.id} value={athlete.id}>
                  {athlete.firstName} {athlete.lastName}
                  {athlete.fiscalCode && ` - ${athlete.fiscalCode}`}
                </option>
              ))}
            </select>
          </div>

          {/* Tipo Documento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FiFile className="inline mr-1" />
              Tipo Documento *
            </label>
            <select
              value={formData.typeId}
              onChange={(e) => setFormData({ ...formData, typeId: e.target.value })}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Seleziona tipo...</option>
              {types.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                  {type.isRequired && ' (Obbligatorio)'}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FiCalendar className="inline mr-1" />
                Data Emissione
              </label>
              <input
                type="date"
                value={formData.issueDate}
                onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FiCalendar className="inline mr-1" />
                Data Scadenza
              </label>
              <input
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Note
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="Note aggiuntive (opzionale)"
            />
          </div>

          {/* Dropzone per file */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              File Documento *
            </label>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
                ${file ? 'bg-green-50 border-green-500' : ''}
              `}
            >
              <input {...getInputProps()} />
              {file ? (
                <div className="flex items-center justify-center space-x-2">
                  <FiFile className="text-green-600 text-2xl" />
                  <div>
                    <p className="text-green-600 font-medium">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    <FiX />
                  </button>
                </div>
              ) : (
                <div>
                  <FiUpload className="mx-auto text-4xl text-gray-400 mb-2" />
                  <p className="text-gray-600">
                    {isDragActive
                      ? 'Rilascia il file qui...'
                      : 'Trascina un file qui o clicca per selezionare'}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Formati supportati: PDF, DOC, DOCX, JPG, PNG (Max 10MB)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Pulsanti */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
              disabled={uploading}
            >
              Annulla
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              disabled={uploading || !file}
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Caricamento...
                </>
              ) : (
                <>
                  <FiUpload className="mr-2" />
                  Carica Documento
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default DocumentUpload;