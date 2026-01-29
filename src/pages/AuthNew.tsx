import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const SMS_AUTH_URL = 'https://functions.poehali.dev/4817b3b5-17f5-4d59-9ee9-e3092837306f';
const VK_AUTH_URL = 'https://functions.poehali.dev/1875b272-ccd5-4605-acd1-44f343ebd7d3';

export default function AuthNew() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<'choice' | 'phone' | 'code'>('choice');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [testCode, setTestCode] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleGuestMode = () => {
    // Временный гостевой токен
    localStorage.setItem('token', 'guest_token');
    localStorage.setItem('user', JSON.stringify({
      id: 0,
      full_name: 'Гость',
      is_guest: true
    }));
    
    toast({
      title: '👋 Добро пожаловать!',
      description: 'Вы вошли как гость. Можете изучить приложение!'
    });
    
    navigate('/');
  };

  const handleVKAuth = async () => {
    try {
      const response = await fetch(VK_AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_auth_url',
          redirect_uri: `${window.location.origin}/auth/vk`
        })
      });

      const data = await response.json();
      
      if (response.ok && data.auth_url) {
        window.location.href = data.auth_url;
      } else {
        toast({
          variant: 'destructive',
          title: 'Ошибка',
          description: 'VK авторизация временно недоступна'
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: 'Не удалось подключиться к VK'
      });
    }
  };

  const handleSendCode = async () => {
    if (!agreedToTerms) {
      toast({
        variant: 'destructive',
        title: 'Необходимо согласие',
        description: 'Подтвердите согласие с условиями использования'
      });
      return;
    }

    if (!phone || phone.length < 10) {
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: 'Введите корректный номер телефона'
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(SMS_AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_code',
          phone: phone
        })
      });

      const data = await response.json();

      if (response.ok) {
        setStep('code');
        
        if (data.test_mode && data.test_code) {
          setTestCode(data.test_code);
          toast({
            title: '📱 Тестовый режим',
            description: `Ваш код: ${data.test_code}`
          });
        } else {
          toast({
            title: '📱 Код отправлен',
            description: 'Проверьте SMS'
          });
        }
      } else {
        toast({
          variant: 'destructive',
          title: 'Ошибка',
          description: data.error || 'Не удалось отправить код'
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: 'Проблема с подключением'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!code || code.length !== 6) {
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: 'Введите 6-значный код'
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(SMS_AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify_code',
          phone: phone,
          code: code
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        toast({
          title: '🎉 Добро пожаловать!',
          description: data.user.full_name || 'Рады видеть вас!'
        });
        
        // Если пользователь новый, отправляем на онбординг
        if (!data.user.onboarding_completed) {
          navigate('/onboarding');
        } else {
          navigate('/');
        }
      } else {
        toast({
          variant: 'destructive',
          title: 'Ошибка',
          description: data.error || 'Неверный код'
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: 'Не удалось войти'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatPhoneInput = (value: string) => {
    const digits = value.replace(/\D/g, '');
    let formatted = '+';
    
    if (digits.length > 0) {
      formatted += digits.substring(0, 1);
    }
    if (digits.length > 1) {
      formatted += ' (' + digits.substring(1, 4);
    }
    if (digits.length > 4) {
      formatted += ') ' + digits.substring(4, 7);
    }
    if (digits.length > 7) {
      formatted += '-' + digits.substring(7, 9);
    }
    if (digits.length > 9) {
      formatted += '-' + digits.substring(9, 11);
    }
    
    return formatted;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <Card className="relative z-10 w-full max-w-md p-8 bg-white/95 backdrop-blur-xl border-0 shadow-2xl rounded-3xl">
        {/* Логотип и заголовок */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-3xl shadow-xl mb-4">
            <Icon name="GraduationCap" size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            Studyfay
          </h1>
          <p className="text-gray-600">Твой умный помощник для учёбы</p>
        </div>

        {/* Экран выбора метода входа */}
        {step === 'choice' && (
          <div className="space-y-4">
            <Button
              onClick={() => setStep('phone')}
              className="w-full h-14 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-base font-semibold shadow-lg rounded-xl"
            >
              <Icon name="Phone" size={20} className="mr-2" />
              Войти по телефону
            </Button>

            <Button
              onClick={handleVKAuth}
              className="w-full h-14 bg-[#0077FF] hover:bg-[#0066DD] text-white text-base font-semibold shadow-lg rounded-xl"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.07 2H8.93C3.33 2 2 3.33 2 8.93v6.14C2 20.67 3.33 22 8.93 22h6.14c5.6 0 6.93-1.33 6.93-6.93V8.93C22 3.33 20.67 2 15.07 2zm3.06 13.54h-1.39c-.56 0-.73-.45-1.73-1.45-.87-.82-1.25-.93-1.47-.93-.3 0-.38.08-.38.47v1.32c0 .36-.11.57-1.06.57-1.52 0-3.21-.92-4.4-2.64-1.78-2.42-2.27-4.25-2.27-4.63 0-.22.08-.43.47-.43h1.39c.35 0 .48.16.62.53.69 2.02 1.84 3.79 2.31 3.79.18 0 .26-.08.26-.54v-2.09c-.06-.99-.58-1.08-.58-1.43 0-.17.14-.35.37-.35h2.18c.3 0 .4.16.4.5v2.81c0 .3.13.4.22.4.18 0 .33-.1.66-.43 1.02-1.14 1.75-2.9 1.75-2.90.1-.2.25-.43.64-.43h1.39c.42 0 .51.21.42.50-.15.71-1.54 2.74-1.54 2.74-.15.24-.21.35 0 .62.15.2.64.63 .97.1 1.08 1.08 1.57 1.57 1.41.42.19.5-.02.5z" />
              </svg>
              Войти через VK
            </Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">или</span>
              </div>
            </div>

            <Button
              onClick={handleGuestMode}
              variant="outline"
              className="w-full h-12 border-2 border-gray-300 hover:border-purple-400 hover:bg-purple-50 text-gray-700 font-medium rounded-xl"
            >
              <Icon name="Eye" size={18} className="mr-2" />
              Попробовать без регистрации
            </Button>

          </div>
        )}

        {/* Экран ввода телефона */}
        {step === 'phone' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Номер телефона
              </label>
              <Input
                type="tel"
                placeholder="+7 (999) 123-45-67"
                value={phone}
                onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
                className="h-14 text-lg border-2 border-gray-300 focus:border-purple-500 rounded-xl"
                maxLength={18}
              />
            </div>

            {/* Чекбокс согласия */}
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <Checkbox
                id="terms"
                checked={agreedToTerms}
                onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                className="mt-1"
              />
              <label htmlFor="terms" className="text-sm text-gray-700 cursor-pointer">
                Я согласен(на) с{' '}
                <Link to="/terms" className="text-purple-600 font-semibold hover:underline">
                  Пользовательским соглашением
                </Link>
                {' '}и{' '}
                <Link to="/privacy" className="text-purple-600 font-semibold hover:underline">
                  Политикой конфиденциальности
                </Link>
                , включая согласие на отправку SMS-кодов для авторизации
              </label>
            </div>

            <Button
              onClick={handleSendCode}
              disabled={loading || !agreedToTerms}
              className="w-full h-14 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-base font-semibold shadow-lg rounded-xl disabled:opacity-50"
            >
              {loading ? (
                <Icon name="Loader2" size={20} className="animate-spin" />
              ) : (
                <>
                  <Icon name="Send" size={20} className="mr-2" />
                  Получить код
                </>
              )}
            </Button>

            <Button
              onClick={() => setStep('choice')}
              variant="ghost"
              className="w-full text-gray-600"
            >
              <Icon name="ArrowLeft" size={18} className="mr-2" />
              Назад
            </Button>
          </div>
        )}

        {/* Экран ввода кода */}
        {step === 'code' && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Icon name="MessageSquare" size={48} className="mx-auto text-purple-600 mb-3" />
              <p className="text-gray-600">
                Код отправлен на номер<br />
                <span className="font-bold text-gray-900">{phone}</span>
              </p>
              {testCode && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                  <p className="text-sm text-yellow-800">
                    🧪 Тестовый код: <span className="font-mono font-bold">{testCode}</span>
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Код из SMS
              </label>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="h-14 text-2xl text-center tracking-widest font-mono border-2 border-gray-300 focus:border-purple-500 rounded-xl"
                maxLength={6}
                autoFocus
              />
            </div>

            <Button
              onClick={handleVerifyCode}
              disabled={loading || code.length !== 6}
              className="w-full h-14 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-base font-semibold shadow-lg rounded-xl disabled:opacity-50"
            >
              {loading ? (
                <Icon name="Loader2" size={20} className="animate-spin" />
              ) : (
                <>
                  <Icon name="LogIn" size={20} className="mr-2" />
                  Войти
                </>
              )}
            </Button>

            <div className="flex items-center justify-between text-sm">
              <Button
                onClick={() => {
                  setStep('phone');
                  setCode('');
                  setTestCode('');
                }}
                variant="ghost"
                size="sm"
                className="text-gray-600"
              >
                <Icon name="ArrowLeft" size={16} className="mr-1" />
                Изменить номер
              </Button>

              <Button
                onClick={handleSendCode}
                variant="ghost"
                size="sm"
                className="text-purple-600"
              >
                <Icon name="RefreshCw" size={16} className="mr-1" />
                Отправить заново
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}