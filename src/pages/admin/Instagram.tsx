import { useState, useRef } from 'react';
import { Plus, Edit, Trash2, Search, Upload, Loader2, ChevronUp, ChevronDown, X, ExternalLink } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useInstagramPosts, useCreateInstagramPost, useUpdateInstagramPost, useDeleteInstagramPost, InstagramPost } from '@/hooks/useInstagram';

export function Instagram() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingPost, setEditingPost] = useState<InstagramPost | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { data: posts = [], isLoading } = useInstagramPosts();
  const createPost = useCreateInstagramPost();
  const updatePost = useUpdateInstagramPost();
  const deletePost = useDeleteInstagramPost();

  const filteredPosts = posts.filter((post) =>
    post.instagram_url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = () => {
    setEditingPost({
      id: 0,
      image_url: '',
      description: '',
      instagram_url: '',
      likes_count: 0,
      comments_count: 0,
      sort_order: posts.length > 0 ? Math.max(...posts.map(p => p.sort_order)) + 1 : 0,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (post: InstagramPost) => {
    setEditingPost({ ...post });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!editingPost) return;

    if (!editingPost.image_url) {
      toast({
        title: 'Помилка',
        description: 'Зображення обов\'язкове',
        variant: 'destructive',
      });
      return;
    }

    const data = {
      image_url: editingPost.image_url,
      description: editingPost.description || null,
      instagram_url: editingPost.instagram_url || '',
      likes_count: editingPost.likes_count || 0,
      comments_count: editingPost.comments_count || 0,
      sort_order: editingPost.sort_order || 0,
      is_active: editingPost.is_active,
    };

    if (editingPost.id === 0) {
      createPost.mutate(data, {
        onSuccess: () => {
          toast({ title: 'Створено', description: 'Пост Instagram успішно створено' });
          setIsDialogOpen(false);
          setEditingPost(null);
        },
        onError: (error: Error) => {
          toast({ title: 'Помилка', description: error.message || 'Не вдалося створити пост', variant: 'destructive' });
        },
      });
    } else {
      updatePost.mutate({ id: editingPost.id, data }, {
        onSuccess: () => {
          toast({ title: 'Оновлено', description: 'Пост Instagram успішно оновлено' });
          setIsDialogOpen(false);
          setEditingPost(null);
        },
        onError: (error: Error) => {
          toast({ title: 'Помилка', description: error.message || 'Не вдалося оновити пост', variant: 'destructive' });
        },
      });
    }
  };

  const handleDelete = (post: InstagramPost) => {
    if (!confirm(`Ви впевнені, що хочете видалити цей пост Instagram?`)) return;
    deletePost.mutate(post.id, {
      onSuccess: () => {
        toast({ title: 'Видалено', description: 'Пост Instagram успішно видалено', variant: 'destructive' });
      },
      onError: (error: Error) => {
        toast({ title: 'Помилка', description: error.message || 'Не вдалося видалити пост', variant: 'destructive' });
      },
    });
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/api/instagram/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Помилка завантаження файлу');
      }

      const data = await response.json();
      setEditingPost({ ...editingPost!, image_url: data.url });
      toast({
        title: 'Успішно',
        description: 'Зображення завантажено',
      });
    } catch (error: any) {
      toast({
        title: 'Помилка',
        description: error.message || 'Не вдалося завантажити зображення',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleMoveUp = (post: InstagramPost) => {
    const currentIndex = posts.findIndex(p => p.id === post.id);
    if (currentIndex > 0) {
      const newOrder = [...posts];
      const postToMove = newOrder[currentIndex];
      const postAbove = newOrder[currentIndex - 1];

      // Swap sort_order values
      const newSortOrder = postAbove.sort_order;
      const oldSortOrder = postToMove.sort_order;

      updatePost.mutate({ id: postToMove.id, data: { ...postToMove, sort_order: newSortOrder } });
      updatePost.mutate({ id: postAbove.id, data: { ...postAbove, sort_order: oldSortOrder } });
    }
  };

  const handleMoveDown = (post: InstagramPost) => {
    const currentIndex = posts.findIndex(p => p.id === post.id);
    if (currentIndex < posts.length - 1) {
      const newOrder = [...posts];
      const postToMove = newOrder[currentIndex];
      const postBelow = newOrder[currentIndex + 1];

      // Swap sort_order values
      const newSortOrder = postBelow.sort_order;
      const oldSortOrder = postToMove.sort_order;

      updatePost.mutate({ id: postToMove.id, data: { ...postToMove, sort_order: newSortOrder } });
      updatePost.mutate({ id: postBelow.id, data: { ...postBelow, sort_order: oldSortOrder } });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Завантаження постів Instagram...</div>
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
                placeholder="Пошук постів Instagram..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Додати пост Instagram
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {filteredPosts.length > 0 ? (
          filteredPosts.map((post, index) => (
            <Card key={post.id}>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Image */}
                  <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-muted">
                    {post.image_url ? (
                      <img
                        src={post.image_url}
                        alt="Instagram post"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        Немає зображення
                      </div>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <span className="font-semibold">{post.likes_count}</span>
                        <span className="text-muted-foreground">лайків</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-semibold">{post.comments_count}</span>
                        <span className="text-muted-foreground">коментарів</span>
                      </div>
                    </div>
                  </div>

                  {/* Instagram Link */}
                  <div className="flex items-center gap-2">
                    <a
                      href={post.instagram_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-primary hover:underline text-sm"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Відкрити в Instagram
                    </a>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleMoveUp(post)}
                        disabled={index === 0}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleMoveDown(post)}
                        disabled={index === filteredPosts.length - 1}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEdit(post)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleDelete(post)}
                        disabled={deletePost.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center text-muted-foreground">
              Постів Instagram не знайдено
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingPost?.id === 0 ? 'Додати новий пост Instagram' : 'Редагувати пост Instagram'}
            </DialogTitle>
          </DialogHeader>
          {editingPost && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="image_url">Зображення</Label>
                <div className="flex items-center gap-4">
                  {editingPost.image_url && (
                    <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 border border-border">
                      <img src={editingPost.image_url} alt="Post" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <Input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileInputChange}
                    className="hidden"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    Завантажити з комп'ютера
                  </Button>
                  {editingPost.image_url && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => setEditingPost({ ...editingPost, image_url: '' })}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="image_url_text">Або вставте посилання на зображення</Label>
                <Input
                  id="image_url_text"
                  value={editingPost.image_url}
                  onChange={(e) => setEditingPost({ ...editingPost, image_url: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Опис до зображення (відображається в галереї)</Label>
                <Textarea
                  id="description"
                  value={editingPost.description || ''}
                  onChange={(e) => setEditingPost({ ...editingPost, description: e.target.value })}
                  placeholder="Опис до зображення..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="likes_count">Кількість лайків</Label>
                  <Input
                    id="likes_count"
                    type="number"
                    min="0"
                    value={editingPost.likes_count}
                    onChange={(e) => setEditingPost({ ...editingPost, likes_count: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="comments_count">Кількість коментарів</Label>
                  <Input
                    id="comments_count"
                    type="number"
                    min="0"
                    value={editingPost.comments_count}
                    onChange={(e) => setEditingPost({ ...editingPost, comments_count: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={editingPost.is_active}
                  onCheckedChange={(checked) => setEditingPost({ ...editingPost, is_active: checked })}
                />
                <Label htmlFor="is_active">Активний</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Скасувати
            </Button>
            <Button onClick={handleSave} disabled={createPost.isPending || updatePost.isPending}>
              Зберегти
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

