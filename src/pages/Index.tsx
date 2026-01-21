import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';

import Icon from '@/components/ui/icon';

const Index = () => {
  const [activeTab, setActiveTab] = useState('schedule');

  const schedule = [
    { id: 1, subject: 'Математический анализ', time: '09:00 - 10:30', room: 'ауд. 301', type: 'lecture', color: 'bg-purple-500' },
    { id: 2, subject: 'Программирование', time: '10:45 - 12:15', room: 'ауд. 205', type: 'practice', color: 'bg-blue-500' },
    { id: 3, subject: 'Физика', time: '12:30 - 14:00', room: 'ауд. 410', type: 'lecture', color: 'bg-green-500' },
    { id: 4, subject: 'Английский язык', time: '14:15 - 15:45', room: 'ауд. 102', type: 'practice', color: 'bg-orange-500' },
  ];

  const tasks = [
    { id: 1, title: 'Решить задачи по матанализу', subject: 'Математика', deadline: '25 янв', priority: 'high', completed: false },
    { id: 2, title: 'Написать лабораторную работу', subject: 'Программирование', deadline: '27 янв', priority: 'medium', completed: false },
    { id: 3, title: 'Подготовить презентацию', subject: 'Физика', deadline: '30 янв', priority: 'low', completed: true },
    { id: 4, title: 'Выучить слова по английскому', subject: 'Английский', deadline: '23 янв', priority: 'high', completed: false },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-green-50">
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center">
                <Icon name="GraduationCap" size={24} className="text-white" />
              </div>
              <h1 className="text-2xl font-heading font-bold bg-gradient-to-r from-purple-600 to-green-600 bg-clip-text text-transparent">
                EduPlanner
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="relative">
                <Icon name="Bell" size={20} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              </Button>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center text-white font-semibold">
                ИИ
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-6 bg-gradient-to-br from-purple-500 to-purple-700 text-white border-0 transition-transform duration-200 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Занятий сегодня</p>
                <p className="text-3xl font-bold mt-2">4</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <Icon name="Calendar" size={24} />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-500 to-green-700 text-white border-0 transition-transform duration-200 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Активных задач</p>
                <p className="text-3xl font-bold mt-2">3</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <Icon name="CheckSquare" size={24} />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-orange-500 to-orange-700 text-white border-0 transition-transform duration-200 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Выполнено задач</p>
                <p className="text-3xl font-bold mt-2">75%</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <Icon name="TrendingUp" size={24} />
              </div>
            </div>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 h-14 bg-white/80 backdrop-blur-md border border-gray-200">
            <TabsTrigger value="schedule" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-purple-700 data-[state=active]:text-white">
              <Icon name="Calendar" size={18} className="mr-2" />
              Расписание
            </TabsTrigger>
            <TabsTrigger value="tasks" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-purple-700 data-[state=active]:text-white">
              <Icon name="CheckSquare" size={18} className="mr-2" />
              Задачи
            </TabsTrigger>
            <TabsTrigger value="scanner" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-purple-700 data-[state=active]:text-white">
              <Icon name="Camera" size={18} className="mr-2" />
              Сканер
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-purple-700 data-[state=active]:text-white">
              <Icon name="BarChart3" size={18} className="mr-2" />
              Аналитика
            </TabsTrigger>
            <TabsTrigger value="profile" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-purple-700 data-[state=active]:text-white">
              <Icon name="User" size={18} className="mr-2" />
              Профиль
            </TabsTrigger>
          </TabsList>

          <TabsContent value="schedule" className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-heading font-bold text-gray-900">Расписание на сегодня</h2>
              <Button className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800">
                <Icon name="Plus" size={18} className="mr-2" />
                Добавить
              </Button>
            </div>
            <div className="space-y-3">
              {schedule.map((lesson) => (
                <Card key={lesson.id} className="p-5 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-l-4" style={{ borderLeftColor: lesson.color.replace('bg-', '#') }}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`w-12 h-12 ${lesson.color} rounded-2xl flex items-center justify-center text-white font-bold text-sm`}>
                        {lesson.time.split(':')[0]}:{lesson.time.split(':')[1].split(' ')[0]}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-900">{lesson.subject}</h3>
                        <p className="text-gray-600 text-sm mt-1">{lesson.time}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className="text-xs">
                            <Icon name="MapPin" size={12} className="mr-1" />
                            {lesson.room}
                          </Badge>
                          <Badge variant={lesson.type === 'lecture' ? 'default' : 'outline'} className="text-xs">
                            {lesson.type === 'lecture' ? 'Лекция' : 'Практика'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon">
                      <Icon name="MoreVertical" size={18} />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-heading font-bold text-gray-900">Учебные задачи</h2>
              <Button className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800">
                <Icon name="Plus" size={18} className="mr-2" />
                Новая задача
              </Button>
            </div>
            <div className="space-y-3">
              {tasks.map((task) => (
                <Card key={task.id} className={`p-5 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] ${task.completed ? 'opacity-60' : ''}`}>
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                        readOnly
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-semibold text-lg ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                        {task.title}
                      </h3>
                      <p className="text-gray-600 text-sm mt-1">{task.subject}</p>
                      <div className="flex items-center gap-2 mt-3">
                        <Badge variant="outline" className="text-xs">
                          <Icon name="Clock" size={12} className="mr-1" />
                          {task.deadline}
                        </Badge>
                        <div className={`w-2 h-2 ${getPriorityColor(task.priority)} rounded-full`}></div>
                        <span className="text-xs text-gray-600 capitalize">
                          {task.priority === 'high' ? 'Высокий' : task.priority === 'medium' ? 'Средний' : 'Низкий'} приоритет
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="scanner" className="animate-fade-in">
            <Card className="p-12 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-green-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <Icon name="Camera" size={48} className="text-purple-600" />
                </div>
                <h2 className="text-2xl font-heading font-bold text-gray-900 mb-3">Сканер расписания</h2>
                <p className="text-gray-600 mb-8">
                  Сфотографируйте ваше расписание, и ИИ автоматически распознает все занятия и добавит их в календарь
                </p>
                <Button size="lg" className="bg-gradient-to-r from-purple-600 to-green-600 hover:from-purple-700 hover:to-green-700">
                  <Icon name="Upload" size={20} className="mr-2" />
                  Загрузить фото
                </Button>
                <p className="text-sm text-gray-500 mt-4">Поддерживаются форматы: JPG, PNG, PDF</p>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">Учебная аналитика</h2>
            
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">Выполнение задач</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Математика</span>
                    <span className="text-sm font-semibold text-purple-600">80%</span>
                  </div>
                  <Progress value={80} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Программирование</span>
                    <span className="text-sm font-semibold text-blue-600">65%</span>
                  </div>
                  <Progress value={65} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Физика</span>
                    <span className="text-sm font-semibold text-green-600">90%</span>
                  </div>
                  <Progress value={90} className="h-2" />
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-4">Занятия в неделю</h3>
                <div className="text-4xl font-bold text-purple-600 mb-2">24</div>
                <p className="text-sm text-gray-600">+2 по сравнению с прошлой неделей</p>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-4">Средний балл</h3>
                <div className="text-4xl font-bold text-green-600 mb-2">4.5</div>
                <p className="text-sm text-gray-600">Отличный результат! 🎉</p>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="profile" className="space-y-6 animate-fade-in">
            <Card className="p-6">
              <div className="flex items-center gap-6 mb-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center text-white text-2xl font-bold">
                  ИИ
                </div>
                <div>
                  <h2 className="text-2xl font-heading font-bold text-gray-900">Иван Иванов</h2>
                  <p className="text-gray-600">ivan.ivanov@university.ru</p>
                  <Badge className="mt-2 bg-gradient-to-r from-purple-600 to-purple-700">Премиум аккаунт</Badge>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Университет</label>
                  <p className="text-gray-900 mt-1">МГУ им. М.В. Ломоносова</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Факультет</label>
                  <p className="text-gray-900 mt-1">Вычислительная математика и кибернетика</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Курс</label>
                  <p className="text-gray-900 mt-1">2 курс, группа 201</p>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="font-semibold text-lg mb-4">Настройки уведомлений</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Напоминания о занятиях</span>
                    <Badge variant="outline">За 15 минут</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Дедлайны по задачам</span>
                    <Badge variant="outline">За 1 день</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Push-уведомления</span>
                    <Badge className="bg-green-600">Включены</Badge>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;