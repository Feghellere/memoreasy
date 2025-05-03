import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAutenticacao } from '../contexto/AutenticacaoContexto';
import type { DadosCadastro } from '../tipos/autenticacao';
import { motion } from 'framer-motion';
import { UserPlus, Brain, ArrowLeft } from 'lucide-react';

export default function Cadastro() {
  const { cadastrar } = useAutenticacao();
  const [erro, setErro] = useState<string>('');
  const [dados, setDados] = useState<DadosCadastro>({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');

    if (dados.senha !== dados.confirmarSenha) {
      setErro('As senhas não coincidem');
      return;
    }

    try {
      await cadastrar(dados.email, dados.senha, dados.nome);
    } catch (error) {
      setErro('Falha no cadastro. Tente novamente.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B1120] to-[#121e36]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="py-4">
          <Link to="/" className="inline-flex items-center text-gray-300 hover:text-white">
            <ArrowLeft className="h-5 w-5 mr-2" />
            Voltar para início
          </Link>
        </nav>
        
        <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#1e293b] rounded-lg shadow-xl p-8 w-full max-w-md border border-gray-700"
          >
            <div className="flex items-center justify-center mb-8">
              <Brain className="h-12 w-12 text-[#3D9CD3]" />
              <h1 className="text-3xl font-bold text-white ml-3">Cadastro</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="nome" className="block text-sm font-medium text-gray-300">
                  Nome
                </label>
                <input
                  type="text"
                  id="nome"
                  value={dados.nome}
                  onChange={(e) => setDados({ ...dados, nome: e.target.value })}
                  className="mt-1 block w-full rounded-md bg-[#131c31] border-gray-700 text-white placeholder-gray-400 focus:border-[#3D9CD3] focus:ring focus:ring-[#3D9CD3] focus:ring-opacity-50"
                  required
                />
              </div>

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

              <div>
                <label htmlFor="confirmarSenha" className="block text-sm font-medium text-gray-300">
                  Confirmar Senha
                </label>
                <input
                  type="password"
                  id="confirmarSenha"
                  value={dados.confirmarSenha}
                  onChange={(e) => setDados({ ...dados, confirmarSenha: e.target.value })}
                  className="mt-1 block w-full rounded-md bg-[#131c31] border-gray-700 text-white placeholder-gray-400 focus:border-[#3D9CD3] focus:ring focus:ring-[#3D9CD3] focus:ring-opacity-50"
                  required
                />
              </div>

              {erro && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-red-400 text-sm"
                >
                  {erro}
                </motion.p>
              )}

              <button
                type="submit"
                className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#3D9CD3] hover:bg-[#2D8BA8] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3D9CD3] transition-colors"
              >
                <UserPlus className="h-5 w-5 mr-2" />
                Criar Conta
              </button>
            </form>

            <p className="mt-4 text-center text-sm text-gray-400">
              Já tem uma conta?{' '}
              <Link to="/login" className="font-medium text-[#3D9CD3] hover:text-[#2D8BA8]">
                Faça login
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}