'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Camera, Upload, AlertTriangle, CheckCircle, XCircle, DollarSign } from 'lucide-react';
import { Rental, DamageReport } from '@/types/rental';

interface InspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  rental: Rental;
  onComplete: (inspectionData: InspectionData) => void;
}

interface InspectionData {
  checkedItems: string[];
  damages: DamageReport[];
  totalDamageAmount: number;
  notes: string;
  photos: string[];
  inspectedBy: string;
}

interface ChecklistItem {
  id: string;
  label: string;
  category: 'funcionamento' | 'estrutura' | 'acessorios' | 'limpeza';
  required: boolean;
}

const defaultChecklist: ChecklistItem[] = [
  // Funcionamento
  { id: 'power_on', label: 'Liga normalmente', category: 'funcionamento', required: true },
  { id: 'performance', label: 'Desempenho adequado', category: 'funcionamento', required: true },
  { id: 'controls', label: 'Controles funcionando', category: 'funcionamento', required: true },
  { id: 'safety', label: 'Dispositivos de segurança OK', category: 'funcionamento', required: true },
  
  // Estrutura
  { id: 'body_condition', label: 'Estrutura sem danos', category: 'estrutura', required: true },
  { id: 'paint_condition', label: 'Pintura conservada', category: 'estrutura', required: false },
  { id: 'no_cracks', label: 'Sem rachaduras', category: 'estrutura', required: true },
  { id: 'no_rust', label: 'Sem ferrugem', category: 'estrutura', required: false },
  
  // Acessórios
  { id: 'all_accessories', label: 'Todos os acessórios presentes', category: 'acessorios', required: true },
  { id: 'cables_ok', label: 'Cabos em bom estado', category: 'acessorios', required: true },
  { id: 'manual_present', label: 'Manual presente', category: 'acessorios', required: false },
  
  // Limpeza
  { id: 'clean_exterior', label: 'Exterior limpo', category: 'limpeza', required: true },
  { id: 'clean_interior', label: 'Interior limpo', category: 'limpeza', required: false },
  { id: 'no_odor', label: 'Sem odores', category: 'limpeza', required: false }
];

const categoryLabels = {
  funcionamento: 'Funcionamento',
  estrutura: 'Estrutura',
  acessorios: 'Acessórios',
  limpeza: 'Limpeza'
};

const categoryColors = {
  funcionamento: 'bg-red-50 border-red-200',
  estrutura: 'bg-blue-50 border-blue-200',
  acessorios: 'bg-green-50 border-green-200',
  limpeza: 'bg-yellow-50 border-yellow-200'
};

export function InspectionModal({ isOpen, onClose, rental, onComplete }: InspectionModalProps) {
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const [damages, setDamages] = useState<DamageReport[]>([]);
  const [newDamage, setNewDamage] = useState({
    itemName: '',
    description: '',
    damageValue: 0,
    photos: [] as string[]
  });
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [inspectedBy, setInspectedBy] = useState('Operador Atual');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCheckItem = (itemId: string, checked: boolean) => {
    if (checked) {
      setCheckedItems(prev => [...prev, itemId]);
    } else {
      setCheckedItems(prev => prev.filter(id => id !== itemId));
    }
  };

  const handleAddDamage = () => {
    if (!newDamage.itemName || !newDamage.description) return;

    const damage: DamageReport = {
      id: Date.now().toString(),
      itemId: rental.items[0]?.equipmentId || '',
      itemName: newDamage.itemName,
      description: newDamage.description,
      damageValue: newDamage.damageValue,
      photos: newDamage.photos,
      reportedBy: inspectedBy,
      reportedAt: new Date(),
      status: 'pending'
    };

    setDamages(prev => [...prev, damage]);
    setNewDamage({
      itemName: '',
      description: '',
      damageValue: 0,
      photos: []
    });
  };

  const handleRemoveDamage = (damageId: string) => {
    setDamages(prev => prev.filter(d => d.id !== damageId));
  };

  const handlePhotoUpload = (type: 'general' | 'damage', damageId?: string) => {
    // Simular upload de foto
    const photoUrl = `https://via.placeholder.com/300x200?text=Foto+${Date.now()}`;
    
    if (type === 'general') {
      setPhotos(prev => [...prev, photoUrl]);
    } else if (type === 'damage' && damageId) {
      setDamages(prev => prev.map(d => 
        d.id === damageId 
          ? { ...d, photos: [...d.photos, photoUrl] }
          : d
      ));
    }
  };

  const getTotalDamageAmount = () => {
    return damages.reduce((sum, damage) => sum + damage.damageValue, 0);
  };

  const getRequiredItemsStatus = () => {
    const requiredItems = defaultChecklist.filter(item => item.required);
    const checkedRequiredItems = requiredItems.filter(item => checkedItems.includes(item.id));
    return {
      total: requiredItems.length,
      checked: checkedRequiredItems.length,
      isComplete: checkedRequiredItems.length === requiredItems.length
    };
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    
    const inspectionData: InspectionData = {
      checkedItems,
      damages,
      totalDamageAmount: getTotalDamageAmount(),
      notes,
      photos,
      inspectedBy
    };

    // Simular processamento
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    onComplete(inspectionData);
    setIsSubmitting(false);
    onClose();
  };

  const requiredStatus = getRequiredItemsStatus();
  const canComplete = requiredStatus.isComplete;

  const groupedChecklist = defaultChecklist.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ChecklistItem[]>);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-blue-600" />
            Conferência de Equipamento - {rental.orderNumber}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações do Pedido */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Informações do Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>Cliente:</strong> {rental.client.name}</div>
                <div><strong>Período:</strong> {new Date(rental.startDate).toLocaleDateString('pt-BR')} - {new Date(rental.endDate).toLocaleDateString('pt-BR')}</div>
                <div><strong>Valor Total:</strong> R$ {rental.totalAmount.toFixed(2)}</div>
                <div><strong>Caução:</strong> R$ {rental.securityDeposit.toFixed(2)}</div>
              </div>
            </CardContent>
          </Card>

          {/* Status dos Itens Obrigatórios */}
          <Card className={`border-2 ${requiredStatus.isComplete ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'}`}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {requiredStatus.isComplete ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                  )}
                  <span className="font-medium">
                    Itens Obrigatórios: {requiredStatus.checked}/{requiredStatus.total}
                  </span>
                </div>
                <Badge variant={requiredStatus.isComplete ? 'default' : 'destructive'}>
                  {requiredStatus.isComplete ? 'Completo' : 'Pendente'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Checklist por Categoria */}
          <div className="space-y-4">
            <h3 className="font-semibold">Checklist de Conferência</h3>
            {Object.entries(groupedChecklist).map(([category, items]) => (
              <Card key={category} className={categoryColors[category as keyof typeof categoryColors]}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">{categoryLabels[category as keyof typeof categoryLabels]}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {items.map(item => (
                    <div key={item.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={item.id}
                        checked={checkedItems.includes(item.id)}
                        onCheckedChange={(checked) => handleCheckItem(item.id, checked as boolean)}
                      />
                      <label htmlFor={item.id} className="text-sm flex-1 cursor-pointer">
                        {item.label}
                        {item.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Registro de Avarias */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                Registro de Avarias
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Formulário para Nova Avaria */}
              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="Nome do item"
                  value={newDamage.itemName}
                  onChange={(e) => setNewDamage(prev => ({ ...prev, itemName: e.target.value }))}
                />
                <div className="flex gap-2">
                  <div className="flex items-center gap-1 flex-1">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    <Input
                      type="number"
                      placeholder="Valor da avaria"
                      value={newDamage.damageValue}
                      onChange={(e) => setNewDamage(prev => ({ ...prev, damageValue: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                </div>
              </div>
              <Textarea
                placeholder="Descrição da avaria"
                value={newDamage.description}
                onChange={(e) => setNewDamage(prev => ({ ...prev, description: e.target.value }))}
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handlePhotoUpload('damage')}
                >
                  <Camera className="h-4 w-4 mr-1" />
                  Adicionar Foto
                </Button>
                <Button
                  type="button"
                  onClick={handleAddDamage}
                  disabled={!newDamage.itemName || !newDamage.description}
                >
                  Registrar Avaria
                </Button>
              </div>

              {/* Lista de Avarias */}
              {damages.length > 0 && (
                <div className="space-y-3">
                  <Separator />
                  <h4 className="font-medium text-sm">Avarias Registradas</h4>
                  {damages.map(damage => (
                    <div key={damage.id} className="border rounded-lg p-3 bg-red-50">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-medium text-sm">{damage.itemName}</div>
                          <div className="text-sm text-gray-600">{damage.description}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="destructive">R$ {damage.damageValue.toFixed(2)}</Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveDamage(damage.id)}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {damage.photos.length > 0 && (
                        <div className="flex gap-2 mt-2">
                          {damage.photos.map((photo, index) => (
                            <img
                              key={index}
                              src={photo}
                              alt={`Avaria ${index + 1}`}
                              className="w-16 h-16 object-cover rounded border"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Total de Avarias:</span>
                    <Badge variant="destructive" className="text-base">
                      R$ {getTotalDamageAmount().toFixed(2)}
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Fotos Gerais */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Fotos da Conferência</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handlePhotoUpload('general')}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Adicionar Foto
                </Button>
                {photos.length > 0 && (
                  <div className="grid grid-cols-4 gap-2">
                    {photos.map((photo, index) => (
                      <img
                        key={index}
                        src={photo}
                        alt={`Conferência ${index + 1}`}
                        className="w-full h-20 object-cover rounded border"
                      />
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Observações */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Observações adicionais sobre a conferência..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </CardContent>
          </Card>

          {/* Responsável */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Responsável pela Conferência</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                value={inspectedBy}
                onChange={(e) => setInspectedBy(e.target.value)}
                placeholder="Nome do responsável"
              />
            </CardContent>
          </Card>

          {/* Ações */}
          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <div className="flex gap-2">
              <Button
                onClick={handleComplete}
                disabled={!canComplete || isSubmitting}
                className="min-w-[120px]"
              >
                {isSubmitting ? 'Processando...' : 'Finalizar Conferência'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}