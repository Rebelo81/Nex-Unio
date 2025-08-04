import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// Configurações de upload
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILES_PER_DAMAGE = 5;
const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads', 'damages');

interface UploadResult {
  success: boolean;
  urls: string[];
  errors: string[];
}

// POST - Upload de fotos para avarias
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const rentalId = formData.get('rentalId') as string;
    const damageId = formData.get('damageId') as string;
    const damageType = formData.get('damageType') as string;
    
    if (!rentalId && !damageId) {
      return NextResponse.json(
        { error: 'ID da locação ou da avaria é obrigatório' },
        { status: 400 }
      );
    }
    
    // Coletar arquivos do FormData
    const files: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('photo_') && value instanceof File) {
        files.push(value);
      }
    }
    
    if (files.length === 0) {
      return NextResponse.json(
        { error: 'Nenhuma foto foi enviada' },
        { status: 400 }
      );
    }
    
    if (files.length > MAX_FILES_PER_DAMAGE) {
      return NextResponse.json(
        { error: `Máximo de ${MAX_FILES_PER_DAMAGE} fotos por avaria` },
        { status: 400 }
      );
    }
    
    // Validar arquivos
    const validationErrors: string[] = [];
    files.forEach((file, index) => {
      if (file.size > MAX_FILE_SIZE) {
        validationErrors.push(`Arquivo ${index + 1}: Tamanho máximo de 5MB excedido`);
      }
      
      if (!ALLOWED_TYPES.includes(file.type)) {
        validationErrors.push(`Arquivo ${index + 1}: Tipo não permitido. Use JPEG, PNG ou WebP`);
      }
    });
    
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: 'Arquivos inválidos', details: validationErrors },
        { status: 400 }
      );
    }
    
    // Criar diretório se não existir
    const targetDir = join(UPLOAD_DIR, rentalId || 'temp');
    if (!existsSync(targetDir)) {
      await mkdir(targetDir, { recursive: true });
    }
    
    // Processar uploads
    const uploadResults: UploadResult = {
      success: true,
      urls: [],
      errors: []
    };
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        // Gerar nome único para o arquivo
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const fileName = `${damageId || 'damage'}_${timestamp}_${randomSuffix}.${fileExtension}`;
        
        // Converter File para Buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        // Salvar arquivo
        const filePath = join(targetDir, fileName);
        await writeFile(filePath, buffer);
        
        // Gerar URL pública
        const publicUrl = `/uploads/damages/${rentalId || 'temp'}/${fileName}`;
        uploadResults.urls.push(publicUrl);
        
        console.log(`Foto salva: ${fileName} (${file.size} bytes)`);
      } catch (error) {
        console.error(`Erro ao salvar arquivo ${i + 1}:`, error);
        uploadResults.errors.push(`Erro ao salvar arquivo ${i + 1}`);
        uploadResults.success = false;
      }
    }
    
    // Log de auditoria
    console.log('Upload de fotos de avaria:', {
      rentalId,
      damageId,
      damageType,
      filesCount: files.length,
      successCount: uploadResults.urls.length,
      errorCount: uploadResults.errors.length,
      timestamp: new Date()
    });
    
    // Simular salvamento de metadados no banco
    const photoMetadata = uploadResults.urls.map((url, index) => ({
      id: `photo-${Date.now()}-${index}`,
      url,
      damageId: damageId || `temp-${Date.now()}`,
      rentalId: rentalId || '',
      originalName: files[index].name,
      size: files[index].size,
      type: files[index].type,
      uploadedAt: new Date()
    }));
    
    // Em um sistema real:
    // await prisma.damagePhoto.createMany({ data: photoMetadata });
    
    if (uploadResults.success && uploadResults.errors.length === 0) {
      return NextResponse.json({
        message: 'Fotos enviadas com sucesso',
        urls: uploadResults.urls,
        metadata: photoMetadata
      });
    } else {
      return NextResponse.json({
        message: 'Upload parcialmente bem-sucedido',
        urls: uploadResults.urls,
        errors: uploadResults.errors,
        metadata: photoMetadata
      }, { status: 207 }); // Multi-Status
    }
    
  } catch (error) {
    console.error('Erro no upload de fotos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor durante upload' },
      { status: 500 }
    );
  }
}

// DELETE - Remover foto específica
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const photoUrl = searchParams.get('photoUrl');
    const damageId = searchParams.get('damageId');
    
    if (!photoUrl || !damageId) {
      return NextResponse.json(
        { error: 'URL da foto e ID da avaria são obrigatórios' },
        { status: 400 }
      );
    }
    
    // Extrair caminho do arquivo da URL
    const urlPath = photoUrl.replace('/uploads/damages/', '');
    const filePath = join(UPLOAD_DIR, urlPath);
    
    // Verificar se arquivo existe
    if (!existsSync(filePath)) {
      return NextResponse.json(
        { error: 'Arquivo não encontrado' },
        { status: 404 }
      );
    }
    
    // Remover arquivo
    const fs = require('fs').promises;
    await fs.unlink(filePath);
    
    // Log de auditoria
    console.log('Foto removida:', {
      photoUrl,
      damageId,
      filePath,
      timestamp: new Date()
    });
    
    // Em um sistema real:
    // await prisma.damagePhoto.delete({ where: { url: photoUrl } });
    
    return NextResponse.json({
      message: 'Foto removida com sucesso',
      removedUrl: photoUrl
    });
    
  } catch (error) {
    console.error('Erro ao remover foto:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// GET - Listar fotos de uma avaria
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const damageId = searchParams.get('damageId');
    const rentalId = searchParams.get('rentalId');
    
    if (!damageId && !rentalId) {
      return NextResponse.json(
        { error: 'ID da avaria ou da locação é obrigatório' },
        { status: 400 }
      );
    }
    
    // Em um sistema real, buscar do banco de dados:
    // const photos = await prisma.damagePhoto.findMany({
    //   where: damageId ? { damageId } : { rentalId }
    // });
    
    // Simulação de resposta
    const mockPhotos = [
      {
        id: 'photo-1',
        url: `/uploads/damages/${rentalId}/damage_001.jpg`,
        damageId: damageId || 'damage-1',
        originalName: 'avaria_motor.jpg',
        size: 1024000,
        type: 'image/jpeg',
        uploadedAt: new Date()
      }
    ];
    
    return NextResponse.json({
      photos: mockPhotos,
      total: mockPhotos.length
    });
    
  } catch (error) {
    console.error('Erro ao listar fotos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Função auxiliar para otimizar imagens
async function optimizeImage(buffer: Buffer, quality: number = 80): Promise<Buffer> {
  // Em um sistema real, usar uma biblioteca como sharp:
  // const sharp = require('sharp');
  // return await sharp(buffer)
  //   .jpeg({ quality })
  //   .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
  //   .toBuffer();
  
  // Por enquanto, retornar o buffer original
  return buffer;
}

// Função auxiliar para gerar thumbnail
async function generateThumbnail(buffer: Buffer): Promise<Buffer> {
  // Em um sistema real:
  // const sharp = require('sharp');
  // return await sharp(buffer)
  //   .resize(200, 200, { fit: 'cover' })
  //   .jpeg({ quality: 70 })
  //   .toBuffer();
  
  return buffer;
}

// Função auxiliar para validar tipo de arquivo
function isValidImageType(file: File): boolean {
  return ALLOWED_TYPES.includes(file.type);
}

// Função auxiliar para gerar nome de arquivo seguro
function generateSafeFileName(originalName: string, prefix: string = ''): string {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg';
  const safeName = originalName
    .replace(/[^a-zA-Z0-9.]/g, '_')
    .substring(0, 50);
  
  return `${prefix}${timestamp}_${randomSuffix}_${safeName}.${extension}`;
}