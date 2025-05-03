import { useState, useRef, useEffect } from 'react';
import { useOutletContext, useParams, useNavigate } from 'react-router-dom';
import { 
  MousePointer2, 
  Hand, 
  Pencil, 
  Square, 
  Circle, 
  Type, 
  Image as ImageIcon, 
  Eraser, 
  ArrowUpRight, 
  Undo2, 
  Redo2, 
  Save, 
  Download,
  Trash2,
  Plus,
  Minus
} from 'lucide-react';
import { ElementoLousa, Ferramenta } from '../tipos/lousa';
import { lousaService, Lousa as LousaTipo } from '../lib/lousaService';
import { verificarAutenticacao } from '../lib/supabaseClient';

interface OutletContextType {
  darkMode: boolean;
}

type PontoInicial = {
  x: number;
  y: number;
};

const Lousa = () => {
  const { darkMode } = useOutletContext<OutletContextType>();
  const params = useParams();
  const navigate = useNavigate();
  const lousaIdUrl = params.id;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ferramentaAtual, setFerramentaAtual] = useState<string>('lapis');
  const [desenhando, setDesenhando] = useState<boolean>(false);
  const [corAtual, setCorAtual] = useState<string>('#000000');
  const [espessuraAtual, setEspessuraAtual] = useState<number>(2);
  const [lousaId, setLousaId] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [ultimaPosicao, setUltimaPosicao] = useState<PontoInicial | null>(null);
  const [pontoInicial, setPontoInicial] = useState<PontoInicial | null>(null);
  const estadoOriginalRef = useRef<ImageData | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [posicao, setPosicao] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [arrastando, setArrastando] = useState<boolean>(false);
  const [posicaoArrastoInicial, setPosicaoArrastoInicial] = useState<PontoInicial | null>(null);
  const contedorCanvasRef = useRef<HTMLDivElement>(null);
  const [titulo, setTitulo] = useState<string>('');
  const [descricao, setDescricao] = useState<string>('');
  const [salvando, setSalvando] = useState<boolean>(false);
  const [modalSalvarAberto, setModalSalvarAberto] = useState<boolean>(false);
  
  const ferramentas: Ferramenta[] = [
    { id: 'cursor', icone: MousePointer2, nome: 'Cursor' },
    { id: 'mao', icone: Hand, nome: 'Mover' },
    { id: 'lapis', icone: Pencil, nome: 'Lápis' },
    { id: 'retangulo', icone: Square, nome: 'Retângulo' },
    { id: 'circulo', icone: Circle, nome: 'Círculo' },
    { id: 'texto', icone: Type, nome: 'Texto' },
    { id: 'imagem', icone: ImageIcon, nome: 'Imagem' },
    { id: 'seta', icone: ArrowUpRight, nome: 'Seta' },
    { id: 'borracha', icone: Eraser, nome: 'Borracha' },
  ];

  const cores = [
    '#000000', '#6B7280', '#8B5CF6', '#9333EA',
    '#2563EB', '#3B82F6', '#F59E0B', '#F97316',
    '#10B981', '#059669', '#F87171', '#EF4444'
  ];

  // Inicializar o canvas
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      
      // Ajustar o tamanho do canvas para preencher a área disponível
      function redimensionarCanvas() {
        canvas.width = window.innerWidth - 200;
        canvas.height = window.innerHeight - 150;
        console.log('Canvas redimensionado para:', canvas.width, 'x', canvas.height);
        
        // Aplicar cor de fundo baseada no modo escuro/claro
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = darkMode ? '#121827' : '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      }
      
      window.addEventListener('resize', redimensionarCanvas);
      redimensionarCanvas();
      
      return () => {
        window.removeEventListener('resize', redimensionarCanvas);
      };
    }
  }, [darkMode]);

  // Adicionar efeito para aplicar zoom e pan ao canvas
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      
      // Aplicar transformações de zoom e posição
      canvas.style.transform = `scale(${zoom}) translate(${posicao.x}px, ${posicao.y}px)`;
      canvas.style.transformOrigin = '0 0';
    }
  }, [zoom, posicao]);

  // Função para converter coordenadas do mouse considerando zoom e pan
  const converterCoordenadas = (clientX: number, clientY: number): { x: number, y: number } => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    
    const rect = canvasRef.current.getBoundingClientRect();
    
    // Calcular as coordenadas ajustadas ao zoom e pan
    const x = (clientX - rect.left) / zoom;
    const y = (clientY - rect.top) / zoom;
    
    return { x, y };
  };

  // Handler para zoom com roda do mouse
  const handleRodaMouse = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Ajustar zoom com base na direção da rolagem
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const novoZoom = Math.max(0.5, Math.min(3, zoom + delta));
    
    if (novoZoom !== zoom) {
      // Calcular o ponto em que o mouse está para manter o zoom centrado nesse ponto
      const { x, y } = converterCoordenadas(e.clientX, e.clientY);
      
      // Ajustar a posição para manter o ponto sob o mouse após o zoom
      const fatorEscala = novoZoom / zoom;
      const novoX = x - (x - posicao.x) * fatorEscala;
      const novoY = y - (y - posicao.y) * fatorEscala;
      
      setZoom(novoZoom);
      setPosicao({ x: novoX, y: novoY });
    }
    
    return false;
  };

  // Função para controlar o zoom com botões
  const ajustarZoom = (aumentar: boolean) => {
    setZoom(prevZoom => {
      const novoZoom = aumentar 
        ? Math.min(3, prevZoom + 0.1) 
        : Math.max(0.5, prevZoom - 0.1);
        
      return novoZoom;
    });
  };

  // Função para começar a desenhar
  const iniciarDesenho = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    // Obter coordenadas ajustadas ao zoom e pan
    const { x, y } = converterCoordenadas(e.clientX, e.clientY);
    
    // Se a ferramenta for "mão", iniciar o arrasto do canvas
    if (ferramentaAtual === 'mao') {
      setArrastando(true);
      setPosicaoArrastoInicial({ x: e.clientX, y: e.clientY });
      return;
    }
    
    setDesenhando(true);
    setPontoInicial({ x, y });
    setUltimaPosicao({ x, y });
    
    // Salvar o estado atual do canvas para formas
    if (['retangulo', 'circulo', 'seta'].includes(ferramentaAtual)) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        estadoOriginalRef.current = ctx.getImageData(
          0, 0, canvasRef.current.width, canvasRef.current.height
        );
      }
    }
    
    // Se for lápis, começamos a desenhar imediatamente
    if (ferramentaAtual === 'lapis') {
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;
      
      // Configurar o estilo
      ctx.strokeStyle = corAtual;
      ctx.lineWidth = espessuraAtual;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      // Iniciar um novo caminho
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
    // Para texto, mostrar um prompt
    else if (ferramentaAtual === 'texto') {
      const texto = prompt('Digite seu texto:');
      if (texto && canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;
        
        ctx.font = `${Math.max(12, espessuraAtual * 6)}px Arial`;
        ctx.fillStyle = corAtual;
        ctx.fillText(texto, x, y);
      }
      setDesenhando(false);
    }
    // Para a imagem, abrir seletor de arquivo
    else if (ferramentaAtual === 'imagem') {
      const inputImagem = document.createElement('input');
      inputImagem.type = 'file';
      inputImagem.accept = 'image/*';
      inputImagem.onchange = (event) => {
        const files = (event.target as HTMLInputElement).files;
        if (files && files.length > 0 && canvasRef.current) {
          const file = files[0];
          const reader = new FileReader();
          reader.onload = (e) => {
            if (e.target?.result && canvasRef.current) {
              const img = new Image();
              img.src = e.target.result as string;
              img.onload = () => {
                console.log('Imagem carregada com sucesso:', img.width, 'x', img.height);
                
                // Limpar o canvas antes de desenhar
                const ctx = canvasRef.current?.getContext('2d');
                if (!canvasRef.current || !ctx) {
                  console.error('Canvas ou contexto não disponível');
                  setCarregando(false);
                  return;
                }
                
                ctx.fillStyle = darkMode ? '#121827' : '#ffffff';
                ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                
                // Verificar se a imagem tem dimensões válidas
                if (img.width === 0 || img.height === 0) {
                  console.error('Imagem carregada com dimensões inválidas');
                  setCarregando(false);
                  return;
                }
                
                try {
                  // Desenhar a imagem no canvas com dimensões apropriadas
                  const canvasWidth = canvasRef.current.width;
                  const canvasHeight = canvasRef.current.height;
                  
                  // Manter a proporção da imagem original
                  const aspectRatio = img.width / img.height;
                  let drawWidth = canvasWidth;
                  let drawHeight = canvasHeight;
                  
                  if (canvasWidth / canvasHeight > aspectRatio) {
                    // Canvas é mais largo que a imagem
                    drawWidth = drawHeight * aspectRatio;
                  } else {
                    // Canvas é mais alto que a imagem
                    drawHeight = drawWidth / aspectRatio;
                  }
                  
                  // Centralizar a imagem
                  const x = (canvasWidth - drawWidth) / 2;
                  const y = (canvasHeight - drawHeight) / 2;
                  
                  // Desenhar com dimensões corretas
                  ctx.drawImage(img, 0, 0, img.width, img.height, x, y, drawWidth, drawHeight);
                  console.log('Imagem desenhada no canvas');
                } catch (err) {
                  console.error('Erro ao desenhar a imagem:', err);
                }
                
                setCarregando(false);
              };
            }
          };
          reader.readAsDataURL(file);
        }
      };
      inputImagem.click();
      setDesenhando(false);
    }
  };

  // Função para desenhar
  const desenhar = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Se estiver arrastando o canvas com a ferramenta "mão"
    if (arrastando && posicaoArrastoInicial) {
      const dx = e.clientX - posicaoArrastoInicial.x;
      const dy = e.clientY - posicaoArrastoInicial.y;
      
      // Atualizar posição considerando o zoom
      setPosicao(prevPosicao => ({
        x: prevPosicao.x + dx / zoom,
        y: prevPosicao.y + dy / zoom
      }));
      
      // Atualizar a posição inicial para o próximo movimento
      setPosicaoArrastoInicial({ x: e.clientX, y: e.clientY });
      return;
    }
    
    if (!desenhando || !canvasRef.current || !pontoInicial) return;
    
    // Obter coordenadas ajustadas ao zoom e pan
    const { x, y } = converterCoordenadas(e.clientX, e.clientY);
    
    switch (ferramentaAtual) {
      case 'lapis':
        // Desenho a mão livre
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx || !ultimaPosicao) return;
        
        ctx.lineTo(x, y);
        ctx.stroke();
        setUltimaPosicao({ x, y });
        break;
        
      case 'retangulo':
      case 'circulo':
      case 'seta':
        // Desenho de formas: usamos preview
        desenharFormaPreview(ferramentaAtual, pontoInicial, { x, y });
        break;
        
      case 'borracha':
        // Apagar conteúdo
        const ctxBorracha = canvasRef.current.getContext('2d');
        if (!ctxBorracha) return;
        
        const tamanhoBorracha = espessuraAtual * 5;
        ctxBorracha.globalCompositeOperation = 'destination-out';
        ctxBorracha.beginPath();
        ctxBorracha.arc(x, y, tamanhoBorracha, 0, Math.PI * 2);
        ctxBorracha.fill();
        ctxBorracha.globalCompositeOperation = 'source-over';
        break;
    }
  };

  // Função para desenhar formas temporárias (retângulo, círculo, seta)
  const desenharFormaPreview = (ferramenta: string, inicio: PontoInicial, fim: PontoInicial) => {
    if (!canvasRef.current || !estadoOriginalRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Restaurar o estado original antes de desenhar a forma atualizada
    ctx.putImageData(estadoOriginalRef.current, 0, 0);
    
    // Configurar o estilo
    ctx.strokeStyle = corAtual;
    ctx.fillStyle = corAtual;
    ctx.lineWidth = espessuraAtual;
    
    // Desenhar a forma correspondente
    switch (ferramenta) {
      case 'retangulo':
        const largura = fim.x - inicio.x;
        const altura = fim.y - inicio.y;
        ctx.strokeRect(inicio.x, inicio.y, largura, altura);
        break;
        
      case 'circulo':
        const raio = Math.sqrt(
          Math.pow(fim.x - inicio.x, 2) + Math.pow(fim.y - inicio.y, 2)
        );
        ctx.beginPath();
        ctx.arc(inicio.x, inicio.y, raio, 0, Math.PI * 2);
        ctx.stroke();
        break;
        
      case 'seta':
        // Desenhar a linha
        ctx.beginPath();
        ctx.moveTo(inicio.x, inicio.y);
        ctx.lineTo(fim.x, fim.y);
        ctx.stroke();
        
        // Desenhar a ponta da seta
        const angulo = Math.atan2(fim.y - inicio.y, fim.x - inicio.x);
        const tamanhoSeta = 15;
        
        ctx.beginPath();
        ctx.moveTo(fim.x, fim.y);
        ctx.lineTo(
          fim.x - tamanhoSeta * Math.cos(angulo - Math.PI / 6),
          fim.y - tamanhoSeta * Math.sin(angulo - Math.PI / 6)
        );
        ctx.lineTo(
          fim.x - tamanhoSeta * Math.cos(angulo + Math.PI / 6),
          fim.y - tamanhoSeta * Math.sin(angulo + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();
        break;
    }
  };

  // Função para finalizar o desenho
  const pararDesenho = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Se estiver arrastando o canvas, parar
    if (arrastando) {
      setArrastando(false);
      setPosicaoArrastoInicial(null);
      return;
    }
    
    if (!desenhando || !canvasRef.current || !pontoInicial) {
      setDesenhando(false);
      setPontoInicial(null);
      setUltimaPosicao(null);
      estadoOriginalRef.current = null;
      return;
    }
    
    // Para o lápis, finalizar o traço
    if (ferramentaAtual === 'lapis') {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.closePath();
      }
    }
    
    setDesenhando(false);
    setPontoInicial(null);
    setUltimaPosicao(null);
    estadoOriginalRef.current = null;
  };

  // Função para limpar a lousa
  const limparLousa = () => {
    if (!canvasRef.current) return;
    
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    
    ctx.fillStyle = darkMode ? '#121827' : '#ffffff';
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    console.log('Lousa limpa');
  };

  // Carregar lousa existente quando houver um id na URL
  useEffect(() => {
    const carregarLousa = async () => {
      if (!lousaIdUrl) return;
      
      try {
        setCarregando(true);
        
        // Log apenas em desenvolvimento
        if (import.meta.env.DEV) {
          console.log('Carregando lousa com ID:', lousaIdUrl);
        }
        
        // Aguardar um momento para garantir que o canvas esteja disponível
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (!canvasRef.current) {
          console.error('Canvas não está disponível');
          setCarregando(false);
          return;
        }
        
        const lousa = await lousaService.obterLousa(lousaIdUrl);
        
        // Log apenas em desenvolvimento
        if (import.meta.env.DEV) {
          console.log('Lousa carregada:', { 
            id: lousa.id, 
            titulo: lousa.titulo,
            temConteudo: !!lousa.conteudo?.length 
          });
        }
        
        setLousaId(lousa.id || null);
        setTitulo(lousa.titulo);
        setDescricao(lousa.descricao || '');
        
        // Redimensionar o canvas antes de desenhar
        const canvas = canvasRef.current;
        
        // Ajustar o tamanho do canvas para preencher a área disponível
        canvas.width = window.innerWidth - 200;
        canvas.height = window.innerHeight - 150;
        console.log('Canvas redimensionado para', canvas.width, 'x', canvas.height);
        
        // Aplicar cor de fundo baseada no modo escuro/claro
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          console.error('Não foi possível obter contexto 2D do canvas');
          setCarregando(false);
          return;
        }
        
        ctx.fillStyle = darkMode ? '#121827' : '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Se houver conteúdo, tentar carregar
        if (lousa.conteudo && Array.isArray(lousa.conteudo) && lousa.conteudo.length > 0) {
          console.log('Tentando carregar conteúdo da lousa');
          
          // Se houver um conteúdo base64, carregar
          if (typeof lousa.conteudo[0] === 'string') {
            console.log('Carregando imagem base64');
            
            // Criar a imagem
            const img = new Image();
            
            // Configurar o handler de carregamento
            img.onload = () => {
              console.log('Imagem carregada com sucesso:', img.width, 'x', img.height);
              
              // Verificar se o canvas ainda está disponível
              if (!canvasRef.current || !ctx) {
                console.error('Canvas ou contexto perdido após carregar imagem');
                setCarregando(false);
                return;
              }
              
              // Verificar se a imagem tem dimensões válidas
              if (img.width === 0 || img.height === 0) {
                console.error('Imagem carregada com dimensões inválidas');
                setCarregando(false);
                return;
              }
              
              try {
                // Limpar o canvas antes de desenhar
                ctx.fillStyle = darkMode ? '#121827' : '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // Calcular dimensões para preservar proporção
                const aspectRatio = img.width / img.height;
                let drawWidth = canvas.width;
                let drawHeight = canvas.height;
                
                // Ajustar com base na proporção
                if (canvas.width / canvas.height > aspectRatio) {
                  // Canvas é mais largo que a imagem
                  drawWidth = drawHeight * aspectRatio;
                } else {
                  // Canvas é mais alto que a imagem
                  drawHeight = drawWidth / aspectRatio;
                }
                
                // Centralizar a imagem
                const x = (canvas.width - drawWidth) / 2;
                const y = (canvas.height - drawHeight) / 2;
                
                // Desenhar com dimensões corretas
                ctx.drawImage(img, 0, 0, img.width, img.height, x, y, drawWidth, drawHeight);
                console.log('Imagem desenhada no canvas com dimensões:', drawWidth, 'x', drawHeight);
              } catch (err) {
                console.error('Erro ao desenhar a imagem:', err);
              } finally {
                setCarregando(false);
              }
            };
            
            // Configurar handler de erro
            img.onerror = (err) => {
              console.error('Erro ao carregar imagem da lousa:', err);
              setCarregando(false);
            };
            
            // Iniciar carregamento da imagem
            img.src = lousa.conteudo[0] as string;
          } else {
            console.warn('Conteúdo da lousa não é uma string:', lousa.conteudo[0]);
            setCarregando(false);
          }
        } else {
          console.warn('Lousa não tem conteúdo para carregar');
          setCarregando(false);
        }
      } catch (error) {
        console.error('Erro ao carregar lousa:', error);
        alert('Não foi possível carregar a lousa. Tente novamente.');
        setCarregando(false);
      }
    };
    
    if (lousaIdUrl) {
      carregarLousa();
    }
  }, [lousaIdUrl, darkMode]);

  // Função para salvar o desenho da lousa
  const salvarLousa = async () => {
    if (!canvasRef.current) return;
    
    try {
      setSalvando(true);
      
      // Validar título (obrigatório)
      if (!titulo.trim()) {
        alert('Por favor, informe um título para a lousa');
        setSalvando(false);
        return;
      }
      
      // Verificar autenticação antes de prosseguir
      const autenticado = await verificarAutenticacao();
      if (!autenticado) {
        alert('Sua sessão pode ter expirado. Por favor, faça login novamente.');
        setSalvando(false);
        // Redirecionar para página de login
        navigate('/login', { replace: true });
        return;
      }
      
      // Obter imagem do canvas como base64
      const imgBase64 = canvasRef.current.toDataURL('image/png');
      
      // Verificar tamanho da imagem (base64 não deve exceder 6MB para evitar problemas com o Supabase)
      if (imgBase64.length > 6 * 1024 * 1024) {
        alert('A imagem da lousa é muito grande. Tente reduzir a complexidade do desenho.');
        setSalvando(false);
        return;
      }
      
      // Estruturar o objeto da lousa
      const dadosLousa = {
        titulo,
        descricao,
        conteudo: [imgBase64],
        thumbnail: imgBase64
      };
      
      if (lousaId) {
        // Atualizar lousa existente
        await lousaService.atualizarLousa(lousaId, dadosLousa);
      } else {
        // Criar nova lousa
        const novaLousa = await lousaService.criarLousa(dadosLousa);
        setLousaId(novaLousa.id || null);
      }
      
      setModalSalvarAberto(false);
      alert('Lousa salva com sucesso!');
    } catch (error: any) {
      console.error('Erro ao salvar lousa:', typeof error === 'object' ? { 
        code: error.code,
        message: error.message 
      } : 'Erro desconhecido');
      
      // Exibir mensagem de erro mais específica
      let mensagemErro = 'Erro ao salvar a lousa. ';
      
      if (error.message && typeof error.message === 'string') {
        if (error.message.includes('autenticado') || error.message.includes('API key')) {
          mensagemErro = 'Erro de autenticação. Por favor, faça login novamente.';
          // Redirecionar para página de login
          navigate('/login', { replace: true });
        } else if (error.message.includes('No API key found')) {
          mensagemErro = 'Chave de API não encontrada. Por favor, atualize a página e faça login novamente.';
          navigate('/login', { replace: true });
        } else if (error.message.includes('violates row-level security policy')) {
          mensagemErro = 'Erro de permissão: você não tem autorização para criar esta lousa. Por favor, faça login novamente.';
          navigate('/login', { replace: true });
        }
      } else if (error.code === '403') {
        mensagemErro += 'Você não tem permissão para salvar esta lousa. Tente fazer login novamente.';
        navigate('/login', { replace: true });
      } else if (error.code === 'PGRST116') {
        mensagemErro += 'Erro de permissão no banco de dados. Tente fazer login novamente.';
        navigate('/login', { replace: true });
      } else if (error.code === '42501') {
        mensagemErro = 'Erro de permissão no banco de dados (RLS). Por favor, faça login novamente.';
        navigate('/login', { replace: true });
      } else {
        mensagemErro += 'Tente novamente ou atualize a página.';
      }
      
      alert(mensagemErro);
    } finally {
      setSalvando(false);
    }
  };

  // Função para abrir modal de salvar
  const abrirModalSalvar = () => {
    setModalSalvarAberto(true);
  };

  return (
    <div className={`h-full flex flex-col ${darkMode ? 'text-white' : 'text-gray-800'}`}>
      {carregando ? (
        <div className="flex-1 flex justify-center items-center">
          <div 
            className={`
              h-10 w-10 animate-spin rounded-full border-4
              ${darkMode ? 'border-gray-600 border-t-blue-500' : 'border-gray-300 border-t-blue-600'}
            `}
          />
        </div>
      ) : (
        <>
          {/* Barra de ferramentas superior */}
          <div 
            className={`
              flex items-center justify-between p-2 border-b
              ${darkMode ? 'bg-[#1e293b] border-gray-700' : 'bg-white border-gray-200'}
            `}
          >
            <div className="flex items-center space-x-1">
              {ferramentas.map((ferramenta) => (
                <button
                  key={ferramenta.id}
                  onClick={() => setFerramentaAtual(ferramenta.id)}
                  className={`
                    p-2 rounded-lg transition-colors
                    ${ferramentaAtual === ferramenta.id 
                      ? darkMode 
                        ? 'bg-gray-700 text-white' 
                        : 'bg-gray-200 text-gray-800' 
                      : darkMode 
                        ? 'text-gray-300 hover:bg-gray-700/50' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                  title={ferramenta.nome}
                >
                  <ferramenta.icone className="h-5 w-5" />
                </button>
              ))}
              
              <div className="h-8 border-l mx-2 border-gray-300 dark:border-gray-700" />
              
              <button
                onClick={() => ajustarZoom(true)}
                className={`
                  p-2 rounded-lg transition-colors
                  ${darkMode 
                    ? 'text-gray-300 hover:bg-gray-700/50' 
                    : 'text-gray-700 hover:bg-gray-100'
                  }
                `}
                title="Aumentar zoom"
              >
                <Plus className="h-5 w-5" />
              </button>
              
              <div className="text-xs font-medium px-2">
                {Math.round(zoom * 100)}%
              </div>
              
              <button
                onClick={() => ajustarZoom(false)}
                className={`
                  p-2 rounded-lg transition-colors
                  ${darkMode 
                    ? 'text-gray-300 hover:bg-gray-700/50' 
                    : 'text-gray-700 hover:bg-gray-100'
                  }
                `}
                title="Diminuir zoom"
              >
                <Minus className="h-5 w-5" />
              </button>
              
              <div className="h-8 border-l mx-2 border-gray-300 dark:border-gray-700" />
              
              <button
                onClick={abrirModalSalvar}
                className={`
                  p-2 rounded-lg transition-colors
                  ${darkMode 
                    ? 'text-gray-300 hover:bg-gray-700/50' 
                    : 'text-gray-700 hover:bg-gray-100'
                  }
                `}
                title="Salvar lousa"
              >
                <Save className="h-5 w-5" />
              </button>
              
              <button
                onClick={limparLousa}
                className={`
                  p-2 rounded-lg transition-colors
                  ${darkMode 
                    ? 'text-gray-300 hover:bg-gray-700/50' 
                    : 'text-gray-700 hover:bg-gray-100'
                  }
                `}
                title="Limpar"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          {/* Área de desenho principal */}
          <div 
            className={`
              flex-1 relative p-4
              ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}
            `}
            onWheel={handleRodaMouse}
            ref={contedorCanvasRef}
          >
            <div className="h-full max-w-full flex items-center justify-center">
              <canvas
                ref={canvasRef}
                style={{
                  cursor: ferramentaAtual === 'mao' 
                    ? arrastando ? 'grabbing' : 'grab' 
                    : 'crosshair',
                  transform: `scale(${zoom}) translate(${posicao.x}px, ${posicao.y}px)`,
                  transformOrigin: '0 0'
                }}
                className={`
                  border border-gray-300 dark:border-gray-700
                  shadow-lg
                `}
                onMouseDown={iniciarDesenho}
                onMouseMove={desenhar}
                onMouseUp={pararDesenho}
                onMouseLeave={pararDesenho}
              />
            </div>
          </div>
          
          {/* Barra de ferramentas lateral - cores e espessura */}
          <div 
            className={`
              absolute right-4 top-1/2 transform -translate-y-1/2
              flex flex-col space-y-3 p-2 rounded-lg shadow-lg
              ${darkMode ? 'bg-[#1e293b] border-gray-700' : 'bg-white border border-gray-200'}
            `}
          >
            <div className="grid grid-cols-3 gap-1">
              {cores.map((cor) => (
                <button
                  key={cor}
                  onClick={() => setCorAtual(cor)}
                  className={`
                    w-6 h-6 rounded-full
                    ${corAtual === cor ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-white dark:ring-offset-gray-900' : ''}
                  `}
                  style={{ backgroundColor: cor }}
                  title={`Cor ${cor}`}
                />
              ))}
            </div>
            
            <div className="h-px bg-gray-300 dark:bg-gray-700 w-full" />
            
            <div className="flex flex-col items-center space-y-1">
              <input
                type="range"
                min="1"
                max="10"
                value={espessuraAtual}
                onChange={(e) => setEspessuraAtual(parseInt(e.target.value))}
                className="w-full"
              />
              <div 
                className="w-full h-2 rounded-full"
                style={{ height: `${espessuraAtual}px`, backgroundColor: corAtual }}
              />
            </div>
          </div>
        </>
      )}

      {/* Modal de salvar */}
      {modalSalvarAberto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`
            w-full max-w-md p-6 rounded-lg shadow-xl
            ${darkMode ? 'bg-[#1e293b] text-white' : 'bg-white text-gray-800'}
          `}>
            <h3 className="text-xl font-bold mb-4">Salvar Lousa</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block mb-1 text-sm font-medium">
                  Título
                </label>
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Digite um título para sua lousa"
                  className={`
                    w-full px-3 py-2 rounded-lg 
                    ${darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'
                    }
                    border focus:outline-none focus:ring-2
                    ${darkMode ? 'focus:ring-blue-500' : 'focus:ring-blue-600'}
                  `}
                  required
                />
              </div>
              
              <div>
                <label className="block mb-1 text-sm font-medium">
                  Descrição <span className="text-xs font-normal opacity-70">(opcional)</span>
                </label>
                <textarea
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Descreva sua lousa brevemente"
                  rows={3}
                  className={`
                    w-full px-3 py-2 rounded-lg resize-none
                    ${darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'
                    }
                    border focus:outline-none focus:ring-2
                    ${darkMode ? 'focus:ring-blue-500' : 'focus:ring-blue-600'}
                  `}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setModalSalvarAberto(false)}
                className={`
                  px-4 py-2 rounded-lg font-medium transition-colors
                  ${darkMode 
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                  }
                `}
                disabled={salvando}
              >
                Cancelar
              </button>
              
              <button
                onClick={salvarLousa}
                className={`
                  px-4 py-2 rounded-lg font-medium transition-colors
                  ${darkMode 
                    ? 'bg-[#3D9CD3] hover:bg-[#3689bd] text-white' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
                disabled={salvando || !titulo.trim()}
              >
                {salvando ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Lousa; 