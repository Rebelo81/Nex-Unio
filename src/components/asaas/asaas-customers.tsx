'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useAsaas } from '@/hooks/use-asaas';
import { 
  User, 
  Mail, 
  Phone,
  MapPin,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  FileText,
  CreditCard
} from 'lucide-react';
import { formatDate, formatCpfCnpj, formatPhone } from '@/lib/utils';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  cpfCnpj: string;
  personType: 'FISICA' | 'JURIDICA';
  company?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  postalCode?: string;
  externalReference?: string;
  notificationDisabled: boolean;
  additionalEmails?: string;
  municipalInscription?: string;
  stateInscription?: string;
  observations?: string;
  dateCreated: string;
  city?: string;
  state?: string;
  country?: string;
}

interface CustomerFormData {
  name: string;
  email: string;
  phone: string;
  cpfCnpj: string;
  company?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  postalCode?: string;
  city?: string;
  state?: string;
  externalReference?: string;
  notificationDisabled: boolean;
  additionalEmails?: string;
  municipalInscription?: string;
  stateInscription?: string;
  observations?: string;
}

export function AsaasCustomers() {
  const { toast } = useToast();
  const { 
    listCustomers, 
    createCustomer, 
    updateCustomer, 
    deleteCustomer, 
    getCustomer,
    validateCpfCnpj,
    loading: isLoading 
  } = useAsaas();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CustomerFormData>({
    name: '',
    email: '',
    phone: '',
    cpfCnpj: '',
    notificationDisabled: false
  });

  // Carregar clientes
  const loadCustomers = async () => {
    try {
      const response = await listCustomers();
      setCustomers(response || []);
      setFilteredCustomers(response || []);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar clientes',
        variant: 'destructive'
      });
    }
  };

  // Filtrar clientes
  useEffect(() => {
    if (!searchTerm) {
      setFilteredCustomers(customers);
    } else {
      const filtered = customers.filter(customer => 
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.cpfCnpj.includes(searchTerm) ||
        (customer.externalReference && customer.externalReference.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredCustomers(filtered);
    }
  }, [searchTerm, customers]);

  // Carregar clientes na inicialização
  useEffect(() => {
    loadCustomers();
  }, []);

  // Resetar formulário
  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      cpfCnpj: '',
      notificationDisabled: false
    });
  };

  // Criar cliente
  const handleCreateCustomer = async () => {
    try {
      if (!formData.name || !formData.email || !formData.cpfCnpj) {
        toast({
          title: 'Erro',
          description: 'Preencha todos os campos obrigatórios',
          variant: 'destructive'
        });
        return;
      }

      if (!validateCpfCnpj(formData.cpfCnpj)) {
        toast({
          title: 'Erro',
          description: 'CPF/CNPJ inválido',
          variant: 'destructive'
        });
        return;
      }

      await createCustomer(formData);
      
      toast({
        title: 'Sucesso',
        description: 'Cliente criado com sucesso!'
      });
      
      setIsCreateDialogOpen(false);
      resetForm();
      loadCustomers();
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao criar cliente',
        variant: 'destructive'
      });
    }
  };

  // Editar cliente
  const handleEditCustomer = async () => {
    if (!selectedCustomer) return;

    try {
      if (!formData.name || !formData.email) {
        toast({
          title: 'Erro',
          description: 'Preencha todos os campos obrigatórios',
          variant: 'destructive'
        });
        return;
      }

      await updateCustomer(selectedCustomer.id, formData);
      
      toast({
        title: 'Sucesso',
        description: 'Cliente atualizado com sucesso!'
      });
      
      setIsEditDialogOpen(false);
      setSelectedCustomer(null);
      resetForm();
      loadCustomers();
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar cliente',
        variant: 'destructive'
      });
    }
  };

  // Excluir cliente
  const handleDeleteCustomer = async (customerId: string) => {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) {
      return;
    }

    try {
      await deleteCustomer(customerId);
      
      toast({
        title: 'Sucesso',
        description: 'Cliente excluído com sucesso!'
      });
      
      loadCustomers();
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao excluir cliente. Verifique se não há pagamentos associados.',
        variant: 'destructive'
      });
    }
  };

  // Abrir diálogo de edição
  const openEditDialog = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      cpfCnpj: customer.cpfCnpj,
      company: customer.company,
      address: customer.address,
      addressNumber: customer.addressNumber,
      complement: customer.complement,
      province: customer.province,
      postalCode: customer.postalCode,
      city: customer.city,
      state: customer.state,
      externalReference: customer.externalReference,
      notificationDisabled: customer.notificationDisabled,
      additionalEmails: customer.additionalEmails,
      municipalInscription: customer.municipalInscription,
      stateInscription: customer.stateInscription,
      observations: customer.observations
    });
    setIsEditDialogOpen(true);
  };

  // Abrir diálogo de visualização
  const openViewDialog = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsViewDialogOpen(true);
  };

  // Renderizar formulário
  const renderForm = (isEdit = false) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome Completo *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Nome do cliente"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cpfCnpj">CPF/CNPJ *</Label>
          <Input
            id="cpfCnpj"
            value={formData.cpfCnpj}
            onChange={(e) => setFormData(prev => ({ ...prev, cpfCnpj: e.target.value }))}
            placeholder="000.000.000-00"
            disabled={isEdit} // CPF/CNPJ não pode ser alterado
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">E-mail *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            placeholder="cliente@exemplo.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Telefone</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            placeholder="(11) 99999-9999"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="company">Empresa</Label>
        <Input
          id="company"
          value={formData.company || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
          placeholder="Nome da empresa (se pessoa jurídica)"
        />
      </div>

      <Separator />
      <h4 className="font-medium">Endereço</h4>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2 col-span-2">
          <Label htmlFor="address">Logradouro</Label>
          <Input
            id="address"
            value={formData.address || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
            placeholder="Rua, Avenida, etc."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="addressNumber">Número</Label>
          <Input
            id="addressNumber"
            value={formData.addressNumber || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, addressNumber: e.target.value }))}
            placeholder="123"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="complement">Complemento</Label>
          <Input
            id="complement"
            value={formData.complement || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, complement: e.target.value }))}
            placeholder="Apto, Sala, etc."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="province">Bairro</Label>
          <Input
            id="province"
            value={formData.province || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, province: e.target.value }))}
            placeholder="Bairro"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="postalCode">CEP</Label>
          <Input
            id="postalCode"
            value={formData.postalCode || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, postalCode: e.target.value }))}
            placeholder="00000-000"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">Cidade</Label>
          <Input
            id="city"
            value={formData.city || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
            placeholder="Cidade"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="state">Estado</Label>
          <Input
            id="state"
            value={formData.state || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
            placeholder="SP"
          />
        </div>
      </div>

      <Separator />
      <h4 className="font-medium">Informações Adicionais</h4>

      <div className="space-y-2">
        <Label htmlFor="externalReference">Referência Externa</Label>
        <Input
          id="externalReference"
          value={formData.externalReference || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, externalReference: e.target.value }))}
          placeholder="ID do cliente no seu sistema"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="observations">Observações</Label>
        <Input
          id="observations"
          value={formData.observations || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, observations: e.target.value }))}
          placeholder="Observações sobre o cliente"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button 
          variant="outline" 
          onClick={() => {
            if (isEdit) {
              setIsEditDialogOpen(false);
            } else {
              setIsCreateDialogOpen(false);
            }
            resetForm();
          }}
        >
          Cancelar
        </Button>
        <Button 
          onClick={isEdit ? handleEditCustomer : handleCreateCustomer}
          disabled={isLoading}
        >
          {isLoading ? 'Salvando...' : (isEdit ? 'Atualizar' : 'Criar')}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Clientes Asaas</h2>
          <p className="text-muted-foreground">Gerencie os clientes cadastrados no Asaas</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Novo Cliente</DialogTitle>
              <DialogDescription>
                Cadastre um novo cliente no Asaas
              </DialogDescription>
            </DialogHeader>
            {renderForm()}
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, email, CPF/CNPJ ou referência..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button variant="outline" onClick={loadCustomers} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Clientes */}
      <Card>
        <CardHeader>
          <CardTitle>Clientes ({filteredCustomers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>CPF/CNPJ</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{customer.name}</div>
                      {customer.company && (
                        <div className="text-sm text-muted-foreground">{customer.company}</div>
                      )}
                      {customer.externalReference && (
                        <Badge variant="outline" className="text-xs mt-1">
                          Ref: {customer.externalReference}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {formatCpfCnpj(customer.cpfCnpj)}
                  </TableCell>
                  <TableCell>{customer.email}</TableCell>
                  <TableCell>{formatPhone(customer.phone)}</TableCell>
                  <TableCell>{formatDate(new Date(customer.dateCreated))}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openViewDialog(customer)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(customer)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCustomer(customer.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredCustomers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
            <DialogDescription>
              Atualize as informações do cliente
            </DialogDescription>
          </DialogHeader>
          {renderForm(true)}
        </DialogContent>
      </Dialog>

      {/* Dialog de Visualização */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Cliente</DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Nome</Label>
                  <p className="font-medium">{selectedCustomer.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">CPF/CNPJ</Label>
                  <p className="font-mono">{formatCpfCnpj(selectedCustomer.cpfCnpj)}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">E-mail</Label>
                  <p>{selectedCustomer.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Telefone</Label>
                  <p>{formatPhone(selectedCustomer.phone)}</p>
                </div>
              </div>

              {selectedCustomer.company && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Empresa</Label>
                  <p>{selectedCustomer.company}</p>
                </div>
              )}

              {(selectedCustomer.address || selectedCustomer.city) && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Endereço</Label>
                  <p>
                    {selectedCustomer.address && `${selectedCustomer.address}, ${selectedCustomer.addressNumber}`}
                    {selectedCustomer.complement && `, ${selectedCustomer.complement}`}
                    {selectedCustomer.province && `, ${selectedCustomer.province}`}
                    {selectedCustomer.city && `, ${selectedCustomer.city}`}
                    {selectedCustomer.state && `/${selectedCustomer.state}`}
                    {selectedCustomer.postalCode && ` - ${selectedCustomer.postalCode}`}
                  </p>
                </div>
              )}

              {selectedCustomer.externalReference && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Referência Externa</Label>
                  <p>{selectedCustomer.externalReference}</p>
                </div>
              )}

              {selectedCustomer.observations && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Observações</Label>
                  <p>{selectedCustomer.observations}</p>
                </div>
              )}

              <div>
                <Label className="text-sm font-medium text-muted-foreground">Criado em</Label>
                <p>{formatDate(new Date(selectedCustomer.dateCreated))}</p>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                  Fechar
                </Button>
                <Button onClick={() => {
                  setIsViewDialogOpen(false);
                  openEditDialog(selectedCustomer);
                }}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}