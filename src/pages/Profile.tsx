import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/lib/auth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const API_URL = 'https://functions.poehali.dev/0c04829e-3c05-40bd-a560-5dcd6c554dd5';

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState(authService.getUser());
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    university: user?.university || '',
    faculty: user?.faculty || '',
    course: user?.course || ''
  });

  useEffect(() => {
    const checkAuth = async () => {
      if (!authService.isAuthenticated()) {
        navigate('/login');
        return;
      }
      const verifiedUser = await authService.verifyToken();
      if (!verifiedUser) {
        navigate('/login');
      } else {
        setUser(verifiedUser);
        setFormData({
          full_name: verifiedUser.full_name || '',
          university: verifiedUser.university || '',
          faculty: verifiedUser.faculty || '',
          course: verifiedUser.course || ''
        });
      }
    };
    checkAuth();
  }, [navigate]);

  const handleSave = async () => {
    if (!formData.full_name.trim()) {
      toast({
        title: "Ошибка",
        description: "Имя не может быть пустым",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      const token = authService.getToken();
      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        setIsEditing(false);
        toast({
          title: "Успешно",
          description: "Профиль обновлён",
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Ошибка",
          description: errorData.error || "Не удалось обновить профиль",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Проблема с подключением к серверу",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      full_name: user?.full_name || '',
      university: user?.university || '',
      faculty: user?.faculty || '',
      course: user?.course || ''
    });
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <header className="bg-white/70 backdrop-blur-xl border-b border-purple-200/50 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/')}
                className="rounded-xl hover:bg-purple-100/50"
              >
                <Icon name="ArrowLeft" size={24} className="text-purple-600" />
              </Button>
              <div>
                <h1 className="text-2xl font-heading font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Мой профиль
                </h1>
                <p className="text-xs text-purple-600/70 font-medium">Управление данными</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="p-8 bg-white border-0 shadow-xl">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <span className="text-3xl font-bold text-white">
                  {user?.full_name?.charAt(0)?.toUpperCase() || '?'}
                </span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{user?.full_name}</h2>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
            </div>
            {!isEditing && (
              <Button
                onClick={() => setIsEditing(true)}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl shadow-lg shadow-purple-500/30"
              >
                <Icon name="Edit" size={18} className="mr-2" />
                Редактировать
              </Button>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <Label htmlFor="full_name" className="text-gray-700 font-semibold">
                Полное имя *
              </Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                disabled={!isEditing}
                className="mt-2 rounded-xl border-2 border-purple-200/50 focus:border-purple-500 disabled:opacity-60"
              />
            </div>

            <div>
              <Label htmlFor="university" className="text-gray-700 font-semibold">
                Университет
              </Label>
              <Input
                id="university"
                value={formData.university}
                onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                disabled={!isEditing}
                className="mt-2 rounded-xl border-2 border-purple-200/50 focus:border-purple-500 disabled:opacity-60"
                placeholder="Название вуза"
              />
            </div>

            <div>
              <Label htmlFor="faculty" className="text-gray-700 font-semibold">
                Факультет
              </Label>
              <Input
                id="faculty"
                value={formData.faculty}
                onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
                disabled={!isEditing}
                className="mt-2 rounded-xl border-2 border-purple-200/50 focus:border-purple-500 disabled:opacity-60"
                placeholder="Название факультета"
              />
            </div>

            <div>
              <Label htmlFor="course" className="text-gray-700 font-semibold">
                Курс
              </Label>
              <Input
                id="course"
                value={formData.course}
                onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                disabled={!isEditing}
                className="mt-2 rounded-xl border-2 border-purple-200/50 focus:border-purple-500 disabled:opacity-60"
                placeholder="Например: 2 курс"
              />
            </div>
          </div>

          {isEditing && (
            <div className="flex gap-3 mt-8">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl shadow-lg shadow-purple-500/30"
              >
                {isSaving ? (
                  <>
                    <Icon name="Loader2" size={18} className="mr-2 animate-spin" />
                    Сохранение...
                  </>
                ) : (
                  <>
                    <Icon name="Check" size={18} className="mr-2" />
                    Сохранить
                  </>
                )}
              </Button>
              <Button
                onClick={handleCancel}
                disabled={isSaving}
                variant="outline"
                className="flex-1 rounded-xl border-2 border-purple-200/50 hover:bg-purple-50"
              >
                <Icon name="X" size={18} className="mr-2" />
                Отмена
              </Button>
            </div>
          )}
        </Card>

        <Card className="mt-6 p-6 bg-red-50 border-2 border-red-200">
          <div className="flex items-start gap-3">
            <Icon name="AlertCircle" size={24} className="text-red-600 mt-0.5" />
            <div>
              <h3 className="font-bold text-red-800 mb-1">Удаление аккаунта</h3>
              <p className="text-sm text-red-700 mb-3">
                Это действие необратимо. Все ваши данные будут удалены.
              </p>
              <Button
                variant="destructive"
                className="rounded-xl"
                onClick={() => {
                  toast({
                    title: "В разработке",
                    description: "Функция удаления аккаунта скоро будет доступна",
                  });
                }}
              >
                <Icon name="Trash2" size={18} className="mr-2" />
                Удалить аккаунт
              </Button>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default Profile;
