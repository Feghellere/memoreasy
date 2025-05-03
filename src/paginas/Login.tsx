import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAutenticacao } from '../contexto/AutenticacaoContexto';
import type { DadosLogin } from '../tipos/autenticacao';
import { motion } from 'framer-motion';
import { LogIn, Brain } from 'lucide-react';

export default function Login() {
  const { entrar } = useAutenticacao();
  const [erro, setErro] = useState<string>('');
  const [dados, setDados] = useState<DadosLogin>({
    email: '',
    senha: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    
    try {
      await entrar(dados.email, dados.senha);
    } catch (error) {
      setErro('Falha no login. Verifique suas credenciais.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B1120] to-[#121e36] flex">
      {/* Left side - Hero Section */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center mb-8">
            <Brain className="h-12 w-12 text-[#3D9CD3]" />
            <h1 className="text-4xl font-bold text-white ml-4">MemorEasy</h1>
          </div>
          <h2 className="text-3xl font-bold text-white mb-6">
            Transforme seu aprendizado em uma jornada extraordinária
          </h2>
          <p className="text-gray-300 text-lg mb-8">
            Utilize ferramentas inteligentes para potencializar seus estudos. 
            Crie flashcards, faça quizzes e organize seu conhecimento de forma eficiente.
          </p>
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-[#1e293b] p-4 rounded-lg border border-gray-700">
              <h3 className="text-white font-semibold mb-2">Flashcards Inteligentes</h3>
              <p className="text-gray-400">Crie e revise cartões de memória com IA</p>
            </div>
            <div className="bg-[#1e293b] p-4 rounded-lg border border-gray-700">
              <h3 className="text-white font-semibold mb-2">Quizzes Adaptativos</h3>
              <p className="text-gray-400">Teste seu conhecimento de forma dinâmica</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1e293b] rounded-lg shadow-xl p-8 w-full max-w-md border border-gray-700"
        >
          <div className="flex items-center justify-center mb-8">
            <LogIn className="h-12 w-12 text-[#3D9CD3]" />
            <h1 className="text-3xl font-bold text-white ml-3">Login</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={dados.email}
                onChange={(e) => setDados({ ...dados, email: e.target.value })}
                className="mt-1 block w-full rounded-md bg-[#131c31] border-gray-700 text-white placeholder-gray-400 focus:border-[#3D9CD3] focus:ring focus:ring-[#3D9CD3] focus:ring-opacity-50"
                required
              />
            </div>

            <div>
              <label htmlFor="senha" className="block text-sm font-medium text-gray-300">
                Senha
              </label>
              <input
                type="password"
                id="senha"
                value={dados.senha}
                onChange={(e) => setDados({ ...dados, senha: e.target.value })}
                className="mt-1 block w-full rounded-md bg-[#131c31] border-gray-700 text-white placeholder-gray-400 focus:border-[#3D9CD3] focus:ring focus:ring-[#3D9CD3] focus:ring-opacity-50"
                required
              />
            </div>

            {erro && (
              <p className="text-red-400 text-sm">{erro}</p>
            )}

            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#3D9CD3] hover:bg-[#2D8BA8] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3D9CD3] transition-colors"
            >
              Entrar
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-400">
            Não tem uma conta?{' '}
            <Link to="/cadastro" className="font-medium text-[#3D9CD3] hover:text-[#2D8BA8]">
              Cadastre-se
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}