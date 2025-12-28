import { useState, useRef } from 'react';
import { Plus, Edit, Trash2, Search, Upload, X, Image as ImageIcon, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Gallery, GalleryImage } from '@/lib/api';
import { 
  useGalleries, 
  useCreateGallery, 
  useUpdateGallery, 
  useDeleteGallery,
  useUploadGalleryImage,
  useUpdateGalleryImage,
  useDeleteGalleryImage,
  useGallery
} from '@/hooks/useGalleries';

export function Galleries() {
  const { data: galleries = [], isLoading } = useGalleries(false);
  const createGallery = useCreateGallery();
  const updateGallery = useUpdateGallery();
  const deleteGallery = useDeleteGallery();
  const uploadImage = useUploadGalleryImage();
  const updateImage = useUpdateGalleryImage();
  const deleteImage = useDeleteGalleryImage();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [editingGallery, setEditingGallery] = useState<Gallery | null>(null);
  const [selectedGalleryId, setSelectedGalleryId] = useState<number | null>(null);
  const [editingImage, setEditingImage] = useState<GalleryImage | null>(null);
  const [isGalleryDialogOpen, setIsGalleryDialogOpen] = useState(false);
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [uploadingImageIndex, setUploadingImageIndex] = useState<number | null>(null);
  const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});
  const { toast } = useToast();

  const { data: selectedGallery } = useGallery(selectedGalleryId || 0, false); // false = get all images (including unpublished) for admin

  const filteredGalleries = galleries.filter(gallery =>
    gallery.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateGallery = () => {
    setEditingGallery({ 
      id: 0, 
      name: '', 
      sort_order: galleries.length, 
      is_published: true,
      created_at: '',
      updated_at: ''
    });
    setIsGalleryDialogOpen(true);
  };

  const handleEditGallery = (gallery: Gallery) => {
    setEditingGallery({ ...gallery });
    setIsGalleryDialogOpen(true);
  };

  const handleSaveGallery = () => {
    if (!editingGallery) return;

    if (!editingGallery.name) {
      toast({
        title: 'Помилка',
        description: 'Введіть назву галереї',
        variant: 'destructive',
      });
      return;
    }

    const data = {
      name: editingGallery.name,
      sort_order: editingGallery.sort_order || 0,
      is_published: editingGallery.is_published,
    };

    if (editingGallery.id === 0) {
      createGallery.mutate(data, {
        onSuccess: () => {
          toast({
            title: 'Створено',
            description: 'Галерею успішно створено',
          });
          setIsGalleryDialogOpen(false);
          setEditingGallery(null);
        },
        onError: (error: Error) => {
          toast({
            title: 'Помилка',
            description: error.message || 'Не вдалося створити галерею',
            variant: 'destructive',
          });
        },
      });
    } else {
      updateGallery.mutate({ id: editingGallery.id, data }, {
        onSuccess: () => {
          toast({
            title: 'Збережено',
            description: 'Галерею успішно оновлено',
          });
          setIsGalleryDialogOpen(false);
          setEditingGallery(null);
        },
        onError: (error: Error) => {
          toast({
            title: 'Помилка',
            description: error.message || 'Не вдалося оновити галерею',
            variant: 'destructive',
          });
        },
      });
    }
  };

  const handleDeleteGallery = (gallery: Gallery) => {
    if (!confirm(`Ви впевнені, що хочете видалити галерею "${gallery.name}"? Всі фотографії також будуть видалені.`)) return;

    deleteGallery.mutate(gallery.id, {
      onSuccess: () => {
        toast({
          title: 'Видалено',
          description: `Галерею "${gallery.name}" видалено`,
          variant: 'destructive',
        });
        if (selectedGalleryId === gallery.id) {
          setSelectedGalleryId(null);
        }
      },
      onError: (error: Error) => {
        toast({
          title: 'Помилка',
          description: error.message || 'Не вдалося видалити галерею',
          variant: 'destructive',
        });
      },
    });
  };

  const handleFileInputChange = (galleryId: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingImageIndex(galleryId);
    uploadImage.mutate(
      { galleryId, file },
      {
        onSuccess: () => {
          toast({
            title: 'Завантажено',
            description: 'Фотографію успішно завантажено',
          });
          setUploadingImageIndex(null);
          if (fileInputRefs.current[galleryId]) {
            fileInputRefs.current[galleryId]!.value = '';
          }
        },
        onError: (error: Error) => {
          toast({
            title: 'Помилка',
            description: error.message || 'Не вдалося завантажити фотографію',
            variant: 'destructive',
          });
          setUploadingImageIndex(null);
        },
      }
    );
  };

  const handleEditImage = (image: GalleryImage) => {
    setEditingImage({ ...image });
    setIsImageDialogOpen(true);
  };

  const handleSaveImage = () => {
    if (!editingImage || !selectedGalleryId) return;

    updateImage.mutate(
      {
        galleryId: selectedGalleryId,
        imageId: editingImage.id,
        data: {
          title: editingImage.title || undefined,
          description: editingImage.description || undefined,
          sort_order: editingImage.sort_order,
          is_published: editingImage.is_published,
        },
      },
      {
        onSuccess: () => {
          toast({
            title: 'Збережено',
            description: 'Фотографію успішно оновлено',
          });
          setIsImageDialogOpen(false);
          setEditingImage(null);
        },
        onError: (error: Error) => {
          toast({
            title: 'Помилка',
            description: error.message || 'Не вдалося оновити фотографію',
            variant: 'destructive',
          });
        },
      }
    );
  };

  const handleDeleteImage = (image: GalleryImage) => {
    if (!selectedGalleryId) return;
    if (!confirm(`Ви впевнені, що хочете видалити цю фотографію?`)) return;

    deleteImage.mutate(
      { galleryId: selectedGalleryId, imageId: image.id },
      {
        onSuccess: () => {
          toast({
            title: 'Видалено',
            description: 'Фотографію успішно видалено',
            variant: 'destructive',
          });
        },
        onError: (error: Error) => {
          toast({
            title: 'Помилка',
            description: error.message || 'Не вдалося видалити фотографію',
            variant: 'destructive',
          });
        },
      }
    );
  };

  const handleMoveGallery = (gallery: Gallery, direction: 'up' | 'down') => {
    const currentIndex = galleries.findIndex(g => g.id === gallery.id);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= galleries.length) return;

    const targetGallery = galleries[newIndex];
    const newSortOrder = targetGallery.sort_order;
    const oldSortOrder = gallery.sort_order;

    // Swap sort orders
    updateGallery.mutate(
      { id: gallery.id, data: { ...gallery, sort_order: newSortOrder } },
      {
        onSuccess: () => {
          updateGallery.mutate(
            { id: targetGallery.id, data: { ...targetGallery, sort_order: oldSortOrder } },
            {
              onSuccess: () => {
                toast({
                  title: 'Оновлено',
                  description: 'Порядок галереї змінено',
                });
              },
            }
          );
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Завантаження галерей...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Пошук галерей..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button onClick={handleCreateGallery}>
              <Plus className="h-4 w-4 mr-2" />
              Додати галерею
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Galleries list */}
        <div className="lg:col-span-1 space-y-4">
          {filteredGalleries.length > 0 ? (
            filteredGalleries.map((gallery) => (
              <Card 
                key={gallery.id} 
                className={`cursor-pointer transition-colors ${
                  selectedGalleryId === gallery.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedGalleryId(gallery.id)}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-semibold">{gallery.name}</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveGallery(gallery, 'up');
                      }}
                      disabled={galleries.findIndex(g => g.id === gallery.id) === 0}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveGallery(gallery, 'down');
                      }}
                      disabled={galleries.findIndex(g => g.id === gallery.id) === galleries.length - 1}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditGallery(gallery);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteGallery(gallery);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {gallery.imagesCount || 0} фотографій
                  </p>
                  {!gallery.is_published && (
                    <p className="text-xs text-muted-foreground mt-1">Не опубліковано</p>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Галерей не знайдено
              </CardContent>
            </Card>
          )}
        </div>

        {/* Gallery images */}
        <div className="lg:col-span-2">
          {selectedGalleryId ? (
            <Card>
              <CardHeader>
                <CardTitle>{selectedGallery?.name || 'Галерея'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <input
                    ref={(el) => (fileInputRefs.current[selectedGalleryId] = el)}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileInputChange(selectedGalleryId, e)}
                  />
                  <Button
                    onClick={() => fileInputRefs.current[selectedGalleryId]?.click()}
                    disabled={uploadingImageIndex === selectedGalleryId}
                  >
                    {uploadingImageIndex === selectedGalleryId ? (
                      <>Завантаження...</>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Додати фотографію
                      </>
                    )}
                  </Button>
                </div>

                {selectedGallery?.images && selectedGallery.images.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {selectedGallery.images.map((image) => (
                      <div key={image.id} className="relative group">
                        <div className="aspect-square relative overflow-hidden rounded-lg">
                          <img
                            src={image.url}
                            alt={image.title || 'Gallery image'}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <Button
                              variant="secondary"
                              size="icon"
                              onClick={() => handleEditImage(image)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => handleDeleteImage(image)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          {!image.is_published && (
                            <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded">
                              Не опубліковано
                            </div>
                          )}
                        </div>
                        {image.title && (
                          <p className="text-sm font-medium mt-2 truncate">{image.title}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Поки що немає фотографій у цій галереї</p>
                    <p className="text-sm mt-2">Натисніть "Додати фотографію" щоб почати</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Оберіть галерею для перегляду фотографій
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Gallery dialog */}
      <Dialog open={isGalleryDialogOpen} onOpenChange={setIsGalleryDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingGallery?.id === 0 ? 'Додати нову галерею' : 'Редагувати галерею'}
            </DialogTitle>
          </DialogHeader>
          {editingGallery && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Назва
                </Label>
                <Input
                  id="name"
                  value={editingGallery.name}
                  onChange={(e) => setEditingGallery({ ...editingGallery, name: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="sort_order" className="text-right">
                  Порядок
                </Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={editingGallery.sort_order}
                  onChange={(e) => setEditingGallery({ ...editingGallery, sort_order: parseInt(e.target.value) || 0 })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="is_published" className="text-right">
                  Опубліковано
                </Label>
                <Switch
                  id="is_published"
                  checked={editingGallery.is_published}
                  onCheckedChange={(checked) => setEditingGallery({ ...editingGallery, is_published: checked })}
                  className="col-span-3"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGalleryDialogOpen(false)}>
              Скасувати
            </Button>
            <Button onClick={handleSaveGallery}>Зберегти</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image dialog */}
      <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Редагувати фотографію</DialogTitle>
          </DialogHeader>
          {editingImage && (
            <>
              <div className="mb-4">
                <img
                  src={editingImage.url}
                  alt={editingImage.title || 'Gallery image'}
                  className="w-full h-64 object-cover rounded-lg"
                />
              </div>
              <div className="grid gap-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="image_title" className="text-right">
                    Назва
                  </Label>
                  <Input
                    id="image_title"
                    value={editingImage.title || ''}
                    onChange={(e) => setEditingImage({ ...editingImage, title: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="image_description" className="text-right">
                    Опис
                  </Label>
                  <Textarea
                    id="image_description"
                    value={editingImage.description || ''}
                    onChange={(e) => setEditingImage({ ...editingImage, description: e.target.value })}
                    className="col-span-3"
                    rows={4}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="image_sort_order" className="text-right">
                    Порядок
                  </Label>
                  <Input
                    id="image_sort_order"
                    type="number"
                    value={editingImage.sort_order}
                    onChange={(e) => setEditingImage({ ...editingImage, sort_order: parseInt(e.target.value) || 0 })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="image_is_published" className="text-right">
                    Опубліковано
                  </Label>
                  <Switch
                    id="image_is_published"
                    checked={editingImage.is_published}
                    onCheckedChange={(checked) => setEditingImage({ ...editingImage, is_published: checked })}
                    className="col-span-3"
                  />
                </div>
              </div>
            </>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImageDialogOpen(false)}>
              Скасувати
            </Button>
            <Button onClick={handleSaveImage}>Зберегти</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

