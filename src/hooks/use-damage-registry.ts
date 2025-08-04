'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface DamageItem {
  id: string;
  itemName: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  repairCost: number;
  photos: File[];
  category: 'structural' | 'functional' | 'aesthetic' | 'missing';
  reportedBy: string;
  reportedAt: Date;
  notes?: string;
  rentalId: string;
  status: 'pending' | 'approved' | 'rejected' | 'repaired';
}

interface DamageReport {
  id: string;
  rentalId: string;
  damages: DamageItem[];
  totalCost: number;
  status: 'draft' | 'submitted' | 'approved' | 'billed';
  createdAt: Date;
  submittedAt?: Date;
  approvedAt?: Date;
  billedAt?: Date;
  approvedBy?: string;
  billingReference?: string;
}

interface UseDamageRegistryReturn {
  damages: DamageItem[];
  damageReport: DamageReport | null;
  isLoading: boolean;
  error: string | null;
  
  // Damage operations
  addDamage: (damage: Omit<DamageItem, 'id' | 'reportedAt' | 'status'>) => Promise<void>;
  updateDamage: (damageId: string, updates: Partial<DamageItem>) => Promise<void>;
  removeDamage: (damageId: string) => Promise<void>;
  
  // Report operations
  createReport: (rentalId: string) => Promise<void>;
  submitReport: (reportId: string) => Promise<void>;
  approveReport: (reportId: string, approvedBy: string) => Promise<void>;
  rejectReport: (reportId: string, reason: string) => Promise<void>;
  
  // Billing operations
  generateBilling: (reportId: string) => Promise<string>;
  sendBillingNotification: (reportId: string, customerEmail: string) => Promise<void>;
  
  // Photo operations
  uploadPhotos: (damageId: string, photos: File[]) => Promise<string[]>;
  deletePhoto: (damageId: string, photoUrl: string) => Promise<void>;
  
  // Analytics
  getDamageStatistics: () => {
    totalDamages: number;
    totalCost: number;
    severityBreakdown: Record<string, number>;
    categoryBreakdown: Record<string, number>;
    averageCostPerDamage: number;
  };
  
  // Utilities
  exportReport: (reportId: string, format: 'pdf' | 'excel') => Promise<Blob>;
  clearError: () => void;
}

export function useDamageRegistry(rentalId?: string): UseDamageRegistryReturn {
  const [damages, setDamages] = useState<DamageItem[]>([]);
  const [damageReport, setDamageReport] = useState<DamageReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const addDamage = useCallback(async (damageData: Omit<DamageItem, 'id' | 'reportedAt' | 'status'>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Upload photos first
      const photoUrls: string[] = [];
      if (damageData.photos.length > 0) {
        const formData = new FormData();
        damageData.photos.forEach((photo, index) => {
          formData.append(`photo_${index}`, photo);
        });
        formData.append('rentalId', damageData.rentalId);
        formData.append('damageType', damageData.category);
        
        const uploadResponse = await fetch('/api/damages/upload-photos', {
          method: 'POST',
          body: formData
        });
        
        if (!uploadResponse.ok) {
          throw new Error('Falha ao fazer upload das fotos');
        }
        
        const uploadResult = await uploadResponse.json();
        photoUrls.push(...uploadResult.urls);
      }
      
      const newDamage: DamageItem = {
        id: `damage-${Date.now()}`,
        ...damageData,
        photos: photoUrls as any, // Store URLs instead of File objects
        reportedAt: new Date(),
        status: 'pending'
      };
      
      // Save to database
      const response = await fetch('/api/damages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newDamage)
      });
      
      if (!response.ok) {
        throw new Error('Falha ao salvar avaria');
      }
      
      const savedDamage = await response.json();
      setDamages(prev => [...prev, savedDamage]);
      
      toast.success('Avaria registrada com sucesso!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateDamage = useCallback(async (damageId: string, updates: Partial<DamageItem>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/damages/${damageId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });
      
      if (!response.ok) {
        throw new Error('Falha ao atualizar avaria');
      }
      
      const updatedDamage = await response.json();
      setDamages(prev => prev.map(d => d.id === damageId ? updatedDamage : d));
      
      toast.success('Avaria atualizada com sucesso!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const removeDamage = useCallback(async (damageId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/damages/${damageId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Falha ao remover avaria');
      }
      
      setDamages(prev => prev.filter(d => d.id !== damageId));
      toast.success('Avaria removida com sucesso!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createReport = useCallback(async (rentalId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const reportData = {
        rentalId,
        damages: damages.filter(d => d.rentalId === rentalId),
        totalCost: damages
          .filter(d => d.rentalId === rentalId)
          .reduce((sum, d) => sum + d.repairCost, 0),
        status: 'draft' as const,
        createdAt: new Date()
      };
      
      const response = await fetch('/api/damage-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reportData)
      });
      
      if (!response.ok) {
        throw new Error('Falha ao criar relatório de avarias');
      }
      
      const report = await response.json();
      setDamageReport(report);
      
      toast.success('Relatório de avarias criado!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [damages]);

  const submitReport = useCallback(async (reportId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/damage-reports/${reportId}/submit`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Falha ao enviar relatório');
      }
      
      const updatedReport = await response.json();
      setDamageReport(updatedReport);
      
      toast.success('Relatório enviado para aprovação!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const approveReport = useCallback(async (reportId: string, approvedBy: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/damage-reports/${reportId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ approvedBy })
      });
      
      if (!response.ok) {
        throw new Error('Falha ao aprovar relatório');
      }
      
      const updatedReport = await response.json();
      setDamageReport(updatedReport);
      
      toast.success('Relatório aprovado!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const rejectReport = useCallback(async (reportId: string, reason: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/damage-reports/${reportId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });
      
      if (!response.ok) {
        throw new Error('Falha ao rejeitar relatório');
      }
      
      const updatedReport = await response.json();
      setDamageReport(updatedReport);
      
      toast.success('Relatório rejeitado');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const generateBilling = useCallback(async (reportId: string): Promise<string> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/damage-reports/${reportId}/billing`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Falha ao gerar cobrança');
      }
      
      const result = await response.json();
      
      // Update report with billing reference
      if (damageReport && damageReport.id === reportId) {
        setDamageReport({
          ...damageReport,
          status: 'billed',
          billedAt: new Date(),
          billingReference: result.billingId
        });
      }
      
      toast.success('Cobrança gerada com sucesso!');
      return result.billingId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [damageReport]);

  const sendBillingNotification = useCallback(async (reportId: string, customerEmail: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/damage-reports/${reportId}/notify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ customerEmail })
      });
      
      if (!response.ok) {
        throw new Error('Falha ao enviar notificação');
      }
      
      toast.success('Notificação enviada ao cliente!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const uploadPhotos = useCallback(async (damageId: string, photos: File[]): Promise<string[]> => {
    const formData = new FormData();
    photos.forEach((photo, index) => {
      formData.append(`photo_${index}`, photo);
    });
    formData.append('damageId', damageId);
    
    const response = await fetch('/api/damages/upload-photos', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error('Falha ao fazer upload das fotos');
    }
    
    const result = await response.json();
    return result.urls;
  }, []);

  const deletePhoto = useCallback(async (damageId: string, photoUrl: string) => {
    const response = await fetch('/api/damages/delete-photo', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ damageId, photoUrl })
    });
    
    if (!response.ok) {
      throw new Error('Falha ao deletar foto');
    }
  }, []);

  const getDamageStatistics = useCallback(() => {
    const totalDamages = damages.length;
    const totalCost = damages.reduce((sum, d) => sum + d.repairCost, 0);
    
    const severityBreakdown = damages.reduce((acc, d) => {
      acc[d.severity] = (acc[d.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const categoryBreakdown = damages.reduce((acc, d) => {
      acc[d.category] = (acc[d.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const averageCostPerDamage = totalDamages > 0 ? totalCost / totalDamages : 0;
    
    return {
      totalDamages,
      totalCost,
      severityBreakdown,
      categoryBreakdown,
      averageCostPerDamage
    };
  }, [damages]);

  const exportReport = useCallback(async (reportId: string, format: 'pdf' | 'excel'): Promise<Blob> => {
    const response = await fetch(`/api/damage-reports/${reportId}/export?format=${format}`);
    
    if (!response.ok) {
      throw new Error('Falha ao exportar relatório');
    }
    
    return response.blob();
  }, []);

  return {
    damages,
    damageReport,
    isLoading,
    error,
    addDamage,
    updateDamage,
    removeDamage,
    createReport,
    submitReport,
    approveReport,
    rejectReport,
    generateBilling,
    sendBillingNotification,
    uploadPhotos,
    deletePhoto,
    getDamageStatistics,
    exportReport,
    clearError
  };
}