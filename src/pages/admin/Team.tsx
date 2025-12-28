import { useState, useRef } from 'react';
import { Plus, Edit, Trash2, Search, Upload, Loader2, ChevronUp, ChevronDown } from 'lucide-react';
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
import { useTeam, useCreateTeamMember, useUpdateTeamMember, useDeleteTeamMember, TeamMember } from '@/hooks/useTeam';

export function Team() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { data: members = [], isLoading } = useTeam(false);
  const createMember = useCreateTeamMember();
  const updateMember = useUpdateTeamMember();
  const deleteMember = useDeleteTeamMember();

  const handleCreate = () => {
    setEditingMember({
      id: 0,
      name: '',
      role: '',
      photo: null,
      description: '',
      sort_order: 0,
      is_active: true,
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (member: TeamMember) => {
    setEditingMember({ ...member });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!editingMember) return;

    if (!editingMember.name || !editingMember.role) {
      toast({
        title: 'Помилка',
        description: 'Ім\'я та посада обов\'язкові',
        variant: 'destructive',
      });
      return;
    }

    const data = {
      name: editingMember.name,
      role: editingMember.role,
      photo: editingMember.photo,
      description: editingMember.description || null,
      sort_order: editingMember.sort_order || 0,
      is_active: editingMember.is_active,
    };

    if (editingMember.id === 0) {
      createMember.mutate(data, {
        onSuccess: () => {
          toast({ title: 'Створено', description: 'Члена команди успішно створено' });
          setIsDialogOpen(false);
          setEditingMember(null);
        },
        onError: (error: Error) => {
          toast({ title: 'Помилка', description: error.message || 'Не вдалося створити члена команди', variant: 'destructive' });
        },
      });
    } else {
      updateMember.mutate({ id: editingMember.id, data }, {
        onSuccess: () => {
          toast({ title: 'Оновлено', description: 'Члена команди успішно оновлено' });
          setIsDialogOpen(false);
          setEditingMember(null);
        },
        onError: (error: Error) => {
          toast({ title: 'Помилка', description: error.message || 'Не вдалося оновити члена команди', variant: 'destructive' });
        },
      });
    }
  };

  const handleDelete = (member: TeamMember) => {
    if (!confirm(`Ви впевнені, що хочете видалити "${member.name}"?`)) return;
    deleteMember.mutate(member.id, {
      onSuccess: () => {
        toast({ title: 'Видалено', description: 'Члена команди успішно видалено', variant: 'destructive' });
      },
      onError: (error: Error) => {
        toast({ title: 'Помилка', description: error.message || 'Не вдалося видалити члена команди', variant: 'destructive' });
      },
    });
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/team/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Не вдалося завантажити зображення');
      }

      const data = await response.json();
      if (editingMember) {
        setEditingMember({ ...editingMember, photo: data.url });
      }
      toast({ title: 'Успіх', description: 'Зображення завантажено' });
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

  const handleMoveUp = (member: TeamMember) => {
    const currentIndex = members.findIndex(m => m.id === member.id);
    if (currentIndex <= 0) return;

    const prevMember = members[currentIndex - 1];
    const newSortOrder = prevMember.sort_order;
    const prevSortOrder = member.sort_order;

    updateMember.mutate({ id: member.id, data: { ...member, sort_order: newSortOrder } });
    updateMember.mutate({ id: prevMember.id, data: { ...prevMember, sort_order: prevSortOrder } });
  };

  const handleMoveDown = (member: TeamMember) => {
    const currentIndex = members.findIndex(m => m.id === member.id);
    if (currentIndex >= members.length - 1) return;

    const nextMember = members[currentIndex + 1];
    const newSortOrder = nextMember.sort_order;
    const nextSortOrder = member.sort_order;

    updateMember.mutate({ id: member.id, data: { ...member, sort_order: newSortOrder } });
    updateMember.mutate({ id: nextMember.id, data: { ...nextMember, sort_order: nextSortOrder } });
  };

  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Завантаження команди...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Наша команда</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Пошук по імені або посаді..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Додати члена команди
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMembers.map((member) => (
          <Card key={member.id} className="overflow-hidden">
            <div className="aspect-square relative bg-muted">
              {member.photo ? (
                <img
                  src={member.photo}
                  alt={member.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  Немає фото
                </div>
              )}
              {!member.is_active && (
                <div className="absolute top-2 right-2 bg-destructive text-destructive-foreground px-2 py-1 rounded text-xs font-semibold">
                  Неактивний
                </div>
              )}
            </div>
            <CardContent className="pt-4">
              <h3 className="font-semibold text-lg mb-1">{member.name}</h3>
              <p className="text-sm text-muted-foreground mb-2">{member.role}</p>
              {member.description && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{member.description}</p>
              )}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleMoveUp(member)}
                    disabled={members.findIndex(m => m.id === member.id) === 0}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleMoveDown(member)}
                    disabled={members.findIndex(m => m.id === member.id) === members.length - 1}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <span className="text-xs text-muted-foreground ml-2">
                    Порядок: {member.sort_order}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(member)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Редагувати
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(member)}
                    disabled={deleteMember.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredMembers.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Членів команди не знайдено
          </CardContent>
        </Card>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingMember?.id === 0 ? 'Додати нового члена команди' : 'Редагувати члена команди'}
            </DialogTitle>
          </DialogHeader>
          {editingMember && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Ім'я *</Label>
                <Input
                  id="name"
                  value={editingMember.name}
                  onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Посада *</Label>
                <Input
                  id="role"
                  value={editingMember.role}
                  onChange={(e) => setEditingMember({ ...editingMember, role: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="photo">Фото</Label>
                <div className="flex items-center gap-4">
                  {editingMember.photo && (
                    <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      <img
                        src={editingMember.photo}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <Input
                      id="photo"
                      value={editingMember.photo || ''}
                      onChange={(e) => setEditingMember({ ...editingMember, photo: e.target.value })}
                      placeholder="URL зображення або завантажте файл"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Завантаження...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Завантажити з комп'ютера
                        </>
                      )}
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileInputChange}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Опис</Label>
                <Textarea
                  id="description"
                  value={editingMember.description || ''}
                  onChange={(e) => setEditingMember({ ...editingMember, description: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sort_order">Порядок сортування</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={editingMember.sort_order}
                  onChange={(e) => setEditingMember({ ...editingMember, sort_order: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={editingMember.is_active}
                  onCheckedChange={(checked) => setEditingMember({ ...editingMember, is_active: checked })}
                />
                <Label htmlFor="is_active">Активний</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Скасувати
            </Button>
            <Button onClick={handleSave}>
              Зберегти
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

