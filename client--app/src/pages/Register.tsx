import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '../context/authContext';
import { useNavigate } from 'react-router-dom';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Toaster, toast } from 'sonner';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Loader } from 'react-feather';

const formSchema = z.object({
  username: z.string().min(3, 'Tên người dùng phải có ít nhất 3 ký tự').max(50, 'Tên người dùng không được vượt quá 50 ký tự'),
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự').max(100, 'Mật khẩu không được vượt quá 100 ký tự'),
});

type FormData = z.infer<typeof formSchema>;

export const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      await register({
        username: data.username,
        email: data.email,
        password: data.password,
      });
      toast.success('Đăng ký thành công! Vui lòng đăng nhập.', {
        style: { background: 'black', color: 'white' },
      });
      navigate('/login');
    } catch (err: any) {
      const errorMessage = err.message || 'Đăng ký thất bại';
      toast.error(errorMessage, {
        style: { background: 'black', color: 'white' },
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <Toaster position="top-right" />
      <div className="w-full max-w-md p-8 bg-neutral-900 text-white rounded-lg shadow-lg border border-white">
        <h2 className="text-3xl font-bold mb-8 text-center">Đăng ký tài khoản</h2>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Tên người dùng</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nhập tên người dùng"
                      className="bg-neutral-800 text-white border-neutral-700 placeholder-neutral-400 focus:ring-green-500 focus:border-green-500"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nhập email của bạn"
                      className="bg-neutral-800 text-white border-neutral-700 placeholder-neutral-400 focus:ring-green-500 focus:border-green-500"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Mật khẩu</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Nhập mật khẩu"
                      className="bg-neutral-800 text-white border-neutral-700 placeholder-neutral-400 focus:ring-green-500 focus:border-green-500"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader className="w-5 h-5 mr-2 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                'Đăng ký'
              )}
            </Button>
          </form>
        </Form>
        <div className="mt-4 text-center">
          <p className="text-neutral-400">
            Đã có tài khoản?{' '}
            <a href="/login" className="text-green-500 hover:underline">
              Đăng nhập
            </a>
          </p>
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            disabled={isLoading}
          >
            Quay lại trang chủ
          </Button>
        </div>
      </div>
    </div>
  );
};