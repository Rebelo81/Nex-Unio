'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  PlusIcon,
  TrashIcon,
  CameraIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
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
}

interface DamageRegistryProps {
  rentalId: string;
  equipmentItems?: Array<{ id: string; name: string; category: string }>;
  onDamageRegistered?: (damages: DamageItem[]) => void;
  existingDamages?: DamageItem[];
  damages?: DamageItem[];
  onChange?: (newDamages: DamageItem[]) => void;
}

const SEVERITY_CONFIG = {
  low: {
    label: 'Baixa',
    color: 'bg-green-100 text-green-800',
    icon: '🟢'
  },
  medium: {
    label: 'Média',
    color: 'bg-yellow-100 text-yellow-800',
    icon: '🟡'
  },
  high: {
    label: 'Alta',
    color: 'bg-orange-100 text-orange-800',
    icon: '🟠'
  },
  critical: {
    label: 'Crítica',
    color: 'bg-red-100 text-red-800',
    icon: '🔴'
  }
};

const CATEGORY_CONFIG = {
  structural: {
    label: 'Estrutural',
    description: 'Danos à estrutura física do equipamento',
    icon: '🏗️'
  },
  functional: {
    label: 'Funcional',
    description: 'Problemas de funcionamento',
    icon: '⚙️'
  },
  aesthetic: {
    label: 'Estético',
    description: 'Danos visuais que não afetam o funcionamento',
    icon: '🎨'
  },
  missing: {
    label: 'Faltante',
    description: 'Peças ou acessórios ausentes',
    icon: '📦'
  }
};

export function DamageRegistry({
  rentalId,
  equipmentItems = [],
  onDamageRegistered,
  existingDamages = [],
  damages: propDamages,
  onChange
}: DamageRegistryProps) {
  const [damages, setDamages] = useState<DamageItem[]>(propDamages || existingDamages);
  const [isAddingDamage, setIsAddingDamage] = useState(false);
  const [newDamage, setNewDamage] = useState<Partial<DamageItem>>({
    itemName: '',
    description: '',
    severity: 'low',
    repairCost: 0,
    photos: [],
    category: 'aesthetic',
    reportedBy: '',
    notes: ''
  });

  // Sincronizar com onChange quando disponível
  useEffect(() => {
    if (onChange) {
      onChange(damages);
    } else if (onDamageRegistered) {
      onDamageRegistered(damages);
    }
  }, [damages, onChange, onDamageRegistered]);

  const handleAddDamage = () => {
    if (!newDamage.itemName || !newDamage.description || !newDamage.reportedBy) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const damage: DamageItem = {
      id: `damage-${Date.now()}`,
      itemName: newDamage.itemName!,
      description: newDamage.description!,
      severity: newDamage.severity!,
      repairCost: newDamage.repairCost || 0,
      photos: newDamage.photos || [],
      category: newDamage.category!,
      reportedBy: newDamage.reportedBy!,
      reportedAt: new Date(),
      notes: newDamage.notes
    };

    const updatedDamages = [...damages, damage];
    setDamages(updatedDamages);
    onDamageRegistered(updatedDamages);

    // Reset form
    setNewDamage({
      itemName: '',
      description: '',
      severity: 'low',
      repairCost: 0,
      photos: [],
      category: 'aesthetic',
      reportedBy: '',
      notes: ''
    });
    setIsAddingDamage(false);

    toast.success('Avaria registrada com sucesso!');
  };

  const handleRemoveDamage = (damageId: string) => {
    const updatedDamages = damages.filter(d => d.id !== damageId);
    setDamages(updatedDamages);
    onDamageRegistered(updatedDamages);
    toast.success('Avaria removida');
  };

  const handlePhotoUpload = (files: FileList | null) => {
    if (!files) return;
    
    const newPhotos = Array.from(files);
    const currentPhotos = newDamage.photos || [];
    
    if (currentPhotos.length + newPhotos.length > 5) {
      toast.error('Máximo de 5 fotos por avaria');
      return;
    }

    setNewDamage(prev => ({
      ...prev,
      photos: [...currentPhotos, ...newPhotos]
    }));
  };

  const removePhoto = (index: number) => {
    setNewDamage(prev => ({
      ...prev,
      photos: prev.photos?.filter((_, i) => i !== index) || []
    }));
  };

  const getTotalRepairCost = () => {
    return damages.reduce((total, damage) => total + damage.repairCost, 0);
  };

  const getDamagesBySeverity = () => {
    return {
      critical: damages.filter(d => d.severity === 'critical').length,
      high: damages.filter(d => d.severity === 'high').length,
      medium: damages.filter(d => d.severity === 'medium').length,
      low: damages.filter(d => d.severity === 'low').length
    };
  };

  const severityStats = getDamagesBySeverity();

  return (
    <div className="space-y-6">
      {/* Header com Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Avarias</p>
                <p className="text-2xl font-bold text-gray-900">{damages.length}</p>
              </div>
              <ExclamationTriangleIcon className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Custo Total</p>
                <p className="text-2xl font-bold text-red-600">
                  R$ {getTotalRepairCost().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <CurrencyDollarIcon className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Críticas/Altas</p>
                <p className="text-2xl font-bold text-red-600">
                  {severityStats.critical + severityStats.high}
                </p>
              </div>
              <div className="text-2xl">🚨</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Fotos Anexadas</p>
                <p className="text-2xl font-bold text-blue-600">
                  {damages.reduce((total, d) => total + d.photos.length, 0)}
                </p>
              </div>
              <CameraIcon className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Avarias Existentes */}
      {damages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DocumentTextIcon className="h-5 w-5" />
              Avarias Registradas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {damages.map((damage) => (
                <div key={damage.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium text-gray-900">{damage.itemName}</h4>
                        <Badge className={SEVERITY_CONFIG[damage.severity].color}>
                          {SEVERITY_CONFIG[damage.severity].icon} {SEVERITY_CONFIG[damage.severity].label}
                        </Badge>
                        <Badge variant="outline">
                          {CATEGORY_CONFIG[damage.category].icon} {CATEGORY_CONFIG[damage.category].label}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{damage.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Reportado por: {damage.reportedBy}</span>
                        <span>Em: {damage.reportedAt.toLocaleString('pt-BR')}</span>
                        <span className="font-medium text-red-600">
                          Custo: R$ {damage.repairCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      {damage.notes && (
                        <p className="text-xs text-gray-600 mt-2 italic">Obs: {damage.notes}</p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveDamage(damage.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {damage.photos.length > 0 && (
                    <div className="flex gap-2 mt-3">
                      {damage.photos.map((photo, index) => (
                        <div key={index} className="relative">
                          <img
                            src={URL.createObjectURL(photo)}
                            alt={`Avaria ${index + 1}`}
                            className="w-16 h-16 object-cover rounded border"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formulário para Nova Avaria */}
      {!isAddingDamage ? (
        <Button
          onClick={() => setIsAddingDamage(true)}
          className="w-full"
          variant="outline"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Registrar Nova Avaria
        </Button>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Registrar Nova Avaria</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Item Afetado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Item Afetado *
              </label>
              <select
                value={newDamage.itemName}
                onChange={(e) => setNewDamage(prev => ({ ...prev, itemName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Selecione o item</option>
                {equipmentItems.map(item => (
                  <option key={item.id} value={item.name}>
                    {item.name} ({item.category})
                  </option>
                ))}
                <option value="Outro">Outro (especificar na descrição)</option>
              </select>
            </div>

            {/* Categoria e Severidade */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria *
                </label>
                <select
                  value={newDamage.category}
                  onChange={(e) => setNewDamage(prev => ({ ...prev, category: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>
                      {config.icon} {config.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Severidade *
                </label>
                <select
                  value={newDamage.severity}
                  onChange={(e) => setNewDamage(prev => ({ ...prev, severity: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {Object.entries(SEVERITY_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>
                      {config.icon} {config.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição da Avaria *
              </label>
              <Textarea
                value={newDamage.description}
                onChange={(e) => setNewDamage(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva detalhadamente a avaria encontrada..."
                rows={3}
              />
            </div>

            {/* Custo de Reparo e Responsável */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Custo Estimado de Reparo (R$)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newDamage.repairCost}
                  onChange={(e) => setNewDamage(prev => ({ ...prev, repairCost: parseFloat(e.target.value) || 0 }))}
                  placeholder="0,00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reportado por *
                </label>
                <Input
                  value={newDamage.reportedBy}
                  onChange={(e) => setNewDamage(prev => ({ ...prev, reportedBy: e.target.value }))}
                  placeholder="Nome do responsável"
                />
              </div>
            </div>

            {/* Upload de Fotos */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fotos da Avaria (máx. 5)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => handlePhotoUpload(e.target.files)}
                  className="hidden"
                  id="photo-upload"
                />
                <label
                  htmlFor="photo-upload"
                  className="cursor-pointer flex flex-col items-center justify-center text-gray-500 hover:text-gray-700"
                >
                  <CameraIcon className="h-8 w-8 mb-2" />
                  <span className="text-sm">Clique para adicionar fotos</span>
                </label>
                
                {newDamage.photos && newDamage.photos.length > 0 && (
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {newDamage.photos.map((photo, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(photo)}
                          alt={`Preview ${index + 1}`}
                          className="w-16 h-16 object-cover rounded border"
                        />
                        <button
                          onClick={() => removePhoto(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Observações */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observações Adicionais
              </label>
              <Textarea
                value={newDamage.notes}
                onChange={(e) => setNewDamage(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Informações adicionais sobre a avaria..."
                rows={2}
              />
            </div>

            <Separator />

            {/* Botões de Ação */}
            <div className="flex gap-3">
              <Button onClick={handleAddDamage} className="flex-1">
                Registrar Avaria
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsAddingDamage(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}