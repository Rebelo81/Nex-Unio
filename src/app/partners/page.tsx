'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Modal } from '@/components/ui/modal';
import { Select } from '@/components/ui/select';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  Building2,
  Calendar,
  DollarSign
} from 'lucide-react';
import { formatCurrency, formatPhone } from '@/lib/utils';
import { Partner } from '@/types';

const PartnersPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    document: '',
    status: 'active' as 'active' | 'inactive' | 'pending',
    commissionRate: '10'
  });

  // Dados simulados
  const [partners, setPartners] = useState<Partner[]>([
    {
      id: '1',
      name: 'Construções ABC Ltda',
      email: 'contato@construcoesabc.com',
      phone: '(11) 99999-9999',
      address: 'Rua das Construções, 123',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234-567',
      document: '12.345.678/0001-90',
      status: 'active',
      commissionRate: 15,
      monthlyRevenue: 25000,
      activeRentals: 12,
      totalEquipment: 45,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-20')
    },
    {
      id: '2',
      name: 'Jardins & Paisagismo',
      email: 'jardins@paisagismo.com',
      phone: '(11) 88888-8888',
      address: 'Av. Verde, 456',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '02345-678',
      document: '23.456.789/0001-01',
      status: 'active',
      commissionRate: 12,
      monthlyRevenue: 18500,
      activeRentals: 8,
      totalEquipment: 32,
      createdAt: new Date('2024-02-01'),
      updatedAt: new Date('2024-02-10')
    },
    {
      id: '3',
      name: 'Eventos Premium',
      email: 'contato@eventospremium.com',
      phone: '(11) 77777-7777',
      address: 'Rua dos Eventos, 789',
      city: 'Rio de Janeiro',
      state: 'RJ',
      zipCode: '20123-456',
      document: '34.567.890/0001-12',
      status: 'inactive',
      commissionRate: 18,
      monthlyRevenue: 16200,
      activeRentals: 5,
      totalEquipment: 28,
      createdAt: new Date('2023-12-10'),
      updatedAt: new Date('2024-01-05')
    }
  ]);

  const filteredPartners = partners.filter(partner => {
    const matchesSearch = partner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         partner.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || partner.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreatePartner = () => {
    setModalMode('create');
    setSelectedPartner(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      document: '',
      status: 'active',
      commissionRate: '10'
    });
    setShowModal(true);
  };

  const handleEditPartner = (partner: Partner) => {
    setModalMode('edit');
    setSelectedPartner(partner);
    setFormData({
      name: partner.name,
      email: partner.email,
      phone: partner.phone,
      address: partner.address,
      city: partner.city || '',
      state: partner.state || '',
      zipCode: partner.zipCode || '',
      document: partner.document || '',
      status: partner.status,
      commissionRate: partner.commissionRate.toString()
    });
    setShowModal(true);
  };

  const handleViewPartner = (partner: Partner) => {
    setModalMode('view');
    setSelectedPartner(partner);
    setShowModal(true);
  };

  const handleDeletePartner = (partner: Partner) => {
    if (window.confirm(`Tem certeza que deseja excluir o parceiro "${partner.name}"? Esta ação não pode ser desfeita.`)) {
      const updatedPartners = partners.filter(p => p.id !== partner.id);
      setPartners(updatedPartners);
      alert('Parceiro excluído com sucesso!');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação básica
    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    
    // Validação de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alert('Por favor, insira um email válido.');
      return;
    }
    
    if (modalMode === 'create') {
      // Criar novo parceiro
      const newPartner: Partner = {
        id: (partners.length + 1).toString(),
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        document: formData.document,
        status: formData.status as 'active' | 'inactive' | 'pending',
        commissionRate: parseFloat(formData.commissionRate) || 0,
        monthlyRevenue: 0,
        activeRentals: 0,
        totalEquipment: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      setPartners([...partners, newPartner]);
      alert('Parceiro criado com sucesso!');
    } else if (modalMode === 'edit' && selectedPartner) {
      // Editar parceiro existente
      const updatedPartners = partners.map(partner => 
        partner.id === selectedPartner.id 
          ? {
              ...partner,
              name: formData.name,
              email: formData.email,
              phone: formData.phone,
              address: formData.address,
              city: formData.city,
              state: formData.state,
              zipCode: formData.zipCode,
              document: formData.document,
              status: formData.status as 'active' | 'inactive' | 'pending',
              commissionRate: parseFloat(formData.commissionRate) || 0,
              updatedAt: new Date()
            }
          : partner
      );
      
      setPartners(updatedPartners);
      alert('Parceiro atualizado com sucesso!');
    }
    
    setShowModal(false);
    setSelectedPartner(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      document: '',
      status: 'active',
      commissionRate: '10'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Ativo</Badge>;
      case 'inactive':
        return <Badge variant="destructive">Inativo</Badge>;
      case 'pending':
        return <Badge variant="warning">Pendente</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Parceiros</h1>
          <p className="text-neutral-600 mt-2">
            Gerencie os parceiros do marketplace
          </p>
        </div>
        <Button onClick={handleCreatePartner}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Parceiro
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por nome, email ou documento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={Search}
              />
            </div>
            <div className="w-full sm:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Todos os status</option>
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
                <option value="pending">Pendente</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Total de Parceiros</p>
                <p className="text-2xl font-bold text-neutral-900">{partners.length}</p>
              </div>
              <Building2 className="h-8 w-8 text-primary-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Parceiros Ativos</p>
                <p className="text-2xl font-bold text-success-600">
                  {partners.filter(p => p.status === 'active').length}
                </p>
              </div>
              <div className="h-8 w-8 bg-success-100 rounded-lg flex items-center justify-center">
                <Building2 className="h-5 w-5 text-success-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Receita Total</p>
                <p className="text-2xl font-bold text-neutral-900">
                  {formatCurrency(partners.reduce((sum, p) => sum + p.monthlyRevenue, 0))}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-warning-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Aluguéis Ativos</p>
                <p className="text-2xl font-bold text-neutral-900">
                  {partners.reduce((sum, p) => sum + p.activeRentals, 0)}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-secondary-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de parceiros */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Parceiros</CardTitle>
          <CardDescription>
            {filteredPartners.length} parceiro(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Parceiro</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Localização</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Equipamentos</TableHead>
                <TableHead>Receita Mensal</TableHead>
                <TableHead>Comissão</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPartners.map((partner) => (
                <TableRow key={partner.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium text-gray-900">{partner.name}</div>
                      <div className="text-sm text-gray-500">{partner.document}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="text-sm text-gray-900">{partner.email}</div>
                      <div className="text-sm text-gray-500">{formatPhone(partner.phone)}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="text-sm text-gray-900">{partner.city}, {partner.state}</div>
                      <div className="text-sm text-gray-500">{partner.zipCode}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(partner.status)}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{partner.totalEquipment}</div>
                      <div className="text-sm text-gray-500">{partner.activeRentals} ativos</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-gray-900">
                      {formatCurrency(partner.monthlyRevenue)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-900">{partner.commissionRate}%</div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewPartner(partner)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditPartner(partner)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDeletePartner(partner)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal de criação/edição */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={modalMode === 'create' ? 'Novo Parceiro' : modalMode === 'edit' ? 'Editar Parceiro' : 'Detalhes do Parceiro'}
        size="lg"
      >
        {modalMode === 'view' && selectedPartner ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Informações Básicas</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Nome</label>
                    <p className="text-gray-900">{selectedPartner.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Documento</label>
                    <p className="text-gray-900">{selectedPartner.document}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Status</label>
                    <div className="mt-1">{getStatusBadge(selectedPartner.status)}</div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Contato</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Email</label>
                    <p className="text-gray-900">{selectedPartner.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Telefone</label>
                    <p className="text-gray-900">{formatPhone(selectedPartner.phone)}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Endereço</h3>
              <p className="text-gray-900">
                {selectedPartner.address}, {selectedPartner.city} - {selectedPartner.state}, {selectedPartner.zipCode}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-600">Equipamentos</label>
                <p className="text-2xl font-bold text-gray-900">{selectedPartner.totalEquipment}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Aluguéis Ativos</label>
                <p className="text-2xl font-bold text-gray-900">{selectedPartner.activeRentals}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Receita Mensal</label>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(selectedPartner.monthlyRevenue)}</p>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Nome da Empresa"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                disabled={modalMode === 'view'}
              />
              

            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={modalMode === 'view'}
              />
              
              <Input
                label="Telefone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(00) 00000-0000"
                required
                disabled={modalMode === 'view'}
              />
            </div>
            
            <Input
              label="Endereço"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
              disabled={modalMode === 'view'}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Select
                label="Status"
                value={formData.status}
                onChange={(value) => setFormData({ ...formData, status: value as 'active' | 'inactive' | 'pending' })}
                options={[
                  { value: 'active', label: 'Ativo' },
                  { value: 'inactive', label: 'Inativo' },
                  { value: 'blocked', label: 'Bloqueado' }
                ]}
                disabled={modalMode === 'view'}
              />
              
              <Input
                label="Taxa de Comissão (%)"
                type="number"
                value={formData.commissionRate.toString()}
                onChange={(e) => setFormData({ ...formData, commissionRate: e.target.value })}
                min="0"
                max="100"
                required
                disabled={modalMode === 'view'}
              />
            </div>
            
            {modalMode !== 'view' && (
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {modalMode === 'create' ? 'Criar Parceiro' : 'Salvar Alterações'}
                </Button>
              </div>
            )}
          </form>
        )}
      </Modal>
    </div>
  );
};

export default PartnersPage;