/**
 * @file App.tsx
 * @description Ponto de entrada da interface do aplicativo Jejuar.
 * Orquestra o trilho contínuo de telas (SplashScreen -> WelcomeScreen -> OnboardingScreen)
 * com transição contínua lateral tipo filme (spring motion), sem intervalos em branco.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'motion/react';
import { SplashScreen } from './components/SplashScreen';
import { WelcomeScreen } from './components/WelcomeScreen';
import { LoginScreen } from './components/LoginScreen';
import { OnboardingScreen } from './components/OnboardingScreen';
import { CadastroStep1 } from './components/CadastroStep1';
import { CadastroStep2 } from './components/CadastroStep2';
import { OnboardingBasicoObjetivo } from './components/OnboardingBasicoObjetivo';
import { OnboardingBasicoExperiencia } from './components/OnboardingBasicoExperiencia';
import { OnboardingBasicoAnoNascimento } from './components/OnboardingBasicoAnoNascimento';
import { OnboardingBasicoGenero } from './components/OnboardingBasicoGenero';
import { OnboardingBasicoAltura } from './components/OnboardingBasicoAltura';
import { OnboardingBasicoPeso } from './components/OnboardingBasicoPeso';
import { OnboardingBasicoPesoDesejado } from './components/OnboardingBasicoPesoDesejado';
import { OnboardingBasicoPrevisao } from './components/OnboardingBasicoPrevisao';
import { InicioScreen } from './components/InicioScreen';
import { buscarDadosUsuarioFirestore } from './services/firebase';
import { sincronizarAssinaturaSilenciosa } from './services/pushNotificationService';
import { inicializarCanaisNativos } from './services/localNotificationService';
import type { TelaAtiva, UsuarioEmCadastro } from './types';


// Mapeamento sequencial de posição das telas na esteira contínua horizontal
const INDICES: Record<TelaAtiva, number> = {
  splash: 0,
  welcome: 1,
  login: 2,
  onboarding: 3,
  cadastro_step1: 4,
  cadastro_step2: 5,
  onboarding_basico_objetivo: 6,
  onboarding_basico_experiencia: 7,
  onboarding_basico_ano: 8,
  onboarding_basico_genero: 9,
  onboarding_basico_altura: 10,
  onboarding_basico_peso: 11,
  onboarding_basico_peso_desejado: 12,
  onboarding_basico_previsao: 13,
  inicio: 14,
};

export default function App() {
  // Estado que define a tela atualmente visível na esteira
  const [telaAtual, setTelaAtual] = useState<TelaAtiva>('splash');
  // Chave para reiniciar a animação da Splash quando solicitado
  const [chaveSplash, setChaveSplash] = useState<number>(0);

  // Estado que armazena os dados do usuário coletados e o ID retornado pelo Firestore
  const [usuarioAtual, setUsuarioAtual] = useState<UsuarioEmCadastro>(() => {
    const idSalvo = typeof window !== 'undefined' ? (localStorage.getItem('jejuar_usuario_id') || '') : '';
    let estadoJejumCache: any = undefined;
    if (typeof window !== 'undefined') {
      const inicioTimestamp = localStorage.getItem('jejuar_inicio_jejum_timestamp');
      const emJejum = localStorage.getItem('jejuar_em_jejum') === 'true';
      const inicioJanelaTimestamp = localStorage.getItem('jejuar_inicio_janela_timestamp');
      const emJanela = localStorage.getItem('jejuar_em_janela_alimentacao') === 'true';
      const diasConsecutivos = Number(localStorage.getItem('jejuar_dias_consecutivos') || 1);
      const ultimoDiaConcluido = localStorage.getItem('jejuar_ultimo_dia');

      if (inicioTimestamp || inicioJanelaTimestamp) {
        estadoJejumCache = {
          emJejum,
          inicioTimestamp,
          emJanelaAlimentacao: emJanela,
          inicioJanelaTimestamp,
          diasConsecutivos,
          ultimoDiaConcluido,
        };
      }
    }

    return {
      id: idSalvo,
      nome: '',
      email: '',
      nivel: 'usuario',
      estadoJejum: estadoJejumCache,
    };
  });

  // Hidratação em segundo plano caso o usuário já possua dados salvos no navegador
  useEffect(() => {
    // Inicializa canais nativos do Android (Capacitor) se for ambiente nativo
    inicializarCanaisNativos().catch(() => {});

    const idSalvo = typeof window !== 'undefined' ? localStorage.getItem('jejuar_usuario_id') : null;
    if (idSalvo) {

      buscarDadosUsuarioFirestore(idSalvo).then((dados) => {
        if (dados) {
          setUsuarioAtual(prev => ({
            ...prev,
            id: dados.id || idSalvo,
            nome: dados.nome || prev.nome,
            email: dados.email || prev.email,
            nivel: dados.nivel || prev.nivel,
            informacoesBasicas: dados.informacoesBasicas || prev.informacoesBasicas,
            estadoJejum: dados.estadoJejum || prev.estadoJejum,
            consumoAguaAtual: dados.consumoAguaAtual || prev.consumoAguaAtual,
            configuracaoAgua: dados.configuracaoAgua || prev.configuracaoAgua,
          }));

          // Sincroniza consumo de água do dia atual no localStorage
          const hojeStr = new Date().toISOString().slice(0, 10);
          if (dados.consumoAguaAtual?.dataStr === hojeStr && typeof dados.consumoAguaAtual.consumidoMl === 'number') {
            localStorage.setItem(`jejuar_agua_${hojeStr}`, String(dados.consumoAguaAtual.consumidoMl));
          }

          // Sincroniza silenciosamente a inscrição de notificações push se a permissão já foi concedida
          sincronizarAssinaturaSilenciosa(idSalvo).catch(() => {});
        }
      }).catch((err) => {
        console.warn("Aviso ao carregar dados do usuário persistido:", err);
      });
    }

    // Ouvinte para re-sincronizar automaticamente o token de push toda vez que o app voltar ao primeiro plano
    const handleVisibilidade = () => {
      if (document.visibilityState === 'visible') {
        const idAtivo = localStorage.getItem('jejuar_usuario_id');
        if (idAtivo) {
          sincronizarAssinaturaSilenciosa(idAtivo).catch(() => {});
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilidade);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilidade);
    };
  }, []);


  // Callback estável para avançar da Splash para Início (se já logado) ou Welcome (se novo)
  const finalizarSplash = useCallback(() => {
    const idSalvo = typeof window !== 'undefined' ? localStorage.getItem('jejuar_usuario_id') : null;
    const sessaoAtiva = typeof window !== 'undefined' ? localStorage.getItem('jejuar_sessao_ativa') : null;
    if (idSalvo && sessaoAtiva === 'true') {
      setTelaAtual('inicio');
    } else {
      setTelaAtual('welcome');
    }
  }, []);

  // Callback estável para reiniciar a visualização da Splash
  const reiniciarSplash = useCallback(() => {
    setChaveSplash(prev => prev + 1);
    setTelaAtual('splash');
  }, []);

  // Callback disparado quando o usuário clica em Registrar no Passo 2
  const handleRegistroSucesso = useCallback((
    usuarioId: string, 
    dadosCompletos: { nome: string; email: string; nivel: string }
  ) => {
    localStorage.setItem('jejuar_usuario_id', usuarioId);
    setUsuarioAtual(prev => ({
      ...prev,
      ...dadosCompletos,
      id: usuarioId,
    }));
    // Desliza suavemente para a primeira tela de informações básicas
    setTelaAtual('onboarding_basico_objetivo');
  }, []);

  // Transição suave de esmaecimento (Fade de 200ms) para a Tela de Início
  // Elimina completamente o efeito de slides passando acelerados na tela ao entrar no app logado
  if (telaAtual === 'inicio') {
    return (
      <div className="w-full h-screen overflow-hidden bg-[#F1F5F9] flex justify-center items-center">
        <div className="w-full max-w-[430px] h-screen max-h-screen bg-[#F5F9FC] shadow-2xl overflow-hidden relative select-none">
          <motion.div
            key="tela-inicio-fade"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="w-full h-full"
          >
            <InicioScreen usuario={usuarioAtual} />
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#F1F5F9] flex justify-center items-center">
      {/* Container responsivo mobile-first */}
      <div className="w-full max-w-[430px] min-h-screen bg-[#FFFFFF] shadow-2xl overflow-hidden relative select-none">
        {/* 
          Esteira Master Contínua
          Desliza horizontalmente entre todas as etapas sem nunca piscar tela em branco
        */}
        <motion.div
          className="flex w-full h-full min-h-screen"
          animate={{ x: `-${INDICES[telaAtual] * 100}%` }}
          transition={{
            type: 'spring',
            stiffness: 280,
            damping: 30,
            mass: 0.8,
          }}
        >
          {/* Seção 0: SplashScreen */}
          <div className="w-full min-w-full flex-shrink-0 min-h-screen">
            <SplashScreen 
              key={chaveSplash}
              onFinalizado={finalizarSplash} 
            />
          </div>

          {/* Seção 1: WelcomeScreen */}
          <div className="w-full min-w-full flex-shrink-0 min-h-screen">
            <WelcomeScreen 
              onComecar={(destino) => setTelaAtual(destino)}
              onIrParaLogin={() => setTelaAtual('login')}
              onReiniciarSplash={reiniciarSplash} 
            />
          </div>

          {/* Seção 2: LoginScreen */}
          <div className="w-full min-w-full flex-shrink-0 min-h-screen">
            <LoginScreen 
              onVoltar={() => setTelaAtual('welcome')}
              onIrParaCadastro={() => setTelaAtual('onboarding')}
              onLoginSucesso={(usuarioLogado) => {
                if (typeof window !== 'undefined' && usuarioLogado.id) {
                  localStorage.setItem('jejuar_usuario_id', usuarioLogado.id);
                  localStorage.setItem('jejuar_sessao_ativa', 'true');

                  // Sincroniza consumo de água do dia no localStorage se disponível
                  const hojeStr = new Date().toISOString().slice(0, 10);
                  if (usuarioLogado.consumoAguaAtual?.dataStr === hojeStr && typeof usuarioLogado.consumoAguaAtual.consumidoMl === 'number') {
                    localStorage.setItem(`jejuar_agua_${hojeStr}`, String(usuarioLogado.consumoAguaAtual.consumidoMl));
                  }

                  // Sincroniza silenciosamente a assinatura push deste aparelho
                  sincronizarAssinaturaSilenciosa(usuarioLogado.id).catch(() => {});
                }
                setUsuarioAtual(prev => ({
                  ...prev,
                  ...usuarioLogado,
                }));
                setTelaAtual('inicio');
              }}
            />
          </div>

          {/* Seção 3: OnboardingScreen (Apresentação 1 a 4) */}
          <div className="w-full min-w-full flex-shrink-0 min-h-screen">
            <OnboardingScreen 
              onAvancar={() => setTelaAtual('cadastro_step1')}
              onVoltar={() => setTelaAtual('welcome')}
            />
          </div>

          {/* Seção 3: Cadastro - Passo 1 (Nome & E-mail) */}
          <div className="w-full min-w-full flex-shrink-0 min-h-screen">
            <CadastroStep1
              nomeInicial={usuarioAtual.nome}
              emailInicial={usuarioAtual.email}
              onAvancar={(dados) => {
                setUsuarioAtual(prev => ({ ...prev, ...dados }));
                setTelaAtual('cadastro_step2');
              }}
              onVoltar={() => setTelaAtual('onboarding')}
            />
          </div>

          {/* Seção 4: Cadastro - Passo 2 (Senha & Botão Registrar) */}
          <div className="w-full min-w-full flex-shrink-0 min-h-screen">
            <CadastroStep2
              nome={usuarioAtual.nome}
              email={usuarioAtual.email}
              onRegistrado={handleRegistroSucesso}
              onVoltar={() => setTelaAtual('cadastro_step1')}
              onCancelarCadastro={() => setTelaAtual('welcome')}
            />
          </div>

          {/* Seção 5: Informações Básicas - Passo 1 (Objetivo Principal) */}
          <div className="w-full min-w-full flex-shrink-0 min-h-screen">
            <OnboardingBasicoObjetivo
              usuarioId={usuarioAtual.id || ''}
              nomeUsuario={usuarioAtual.nome}
              onAvancar={(objetivo) => {
                setUsuarioAtual(prev => ({
                  ...prev,
                  informacoesBasicas: {
                    ...prev.informacoesBasicas,
                    objetivoPrincipal: objetivo,
                  },
                }));
                setTelaAtual('onboarding_basico_experiencia');
              }}
              onVoltar={() => setTelaAtual('cadastro_step2')}
            />
          </div>

          {/* Seção 6: Informações Básicas - Passo 2 (Experiência com Jejum) */}
          <div className="w-full min-w-full flex-shrink-0 min-h-screen">
            <OnboardingBasicoExperiencia
              usuarioId={usuarioAtual.id || ''}
              experienciaInicial={usuarioAtual.informacoesBasicas?.experienciaJejum || 'primeira_vez'}
              onAvancar={(experiencia) => {
                setUsuarioAtual(prev => ({
                  ...prev,
                  informacoesBasicas: {
                    ...prev.informacoesBasicas,
                    experienciaJejum: experiencia,
                  },
                }));
                setTelaAtual('onboarding_basico_ano');
              }}
              onVoltar={() => setTelaAtual('onboarding_basico_objetivo')}
            />
          </div>

          {/* Seção 7: Informações Básicas - Passo 3 (Ano de Nascimento) */}
          <div className="w-full min-w-full flex-shrink-0 min-h-screen">
            <OnboardingBasicoAnoNascimento
              usuarioId={usuarioAtual.id || ''}
              anoInicial={usuarioAtual.informacoesBasicas?.anoNascimento || 2000}
              onAvancar={(ano) => {
                setUsuarioAtual(prev => ({
                  ...prev,
                  informacoesBasicas: {
                    ...prev.informacoesBasicas,
                    anoNascimento: ano,
                  },
                }));
                setTelaAtual('onboarding_basico_genero');
              }}
              onVoltar={() => setTelaAtual('onboarding_basico_experiencia')}
            />
          </div>

          {/* Seção 8: Informações Básicas - Passo 4 (Gênero) */}
          <div className="w-full min-w-full flex-shrink-0 min-h-screen">
            <OnboardingBasicoGenero
              usuarioId={usuarioAtual.id || ''}
              generoInicial={usuarioAtual.informacoesBasicas?.genero || 'Feminino'}
              onAvancar={(genero) => {
                setUsuarioAtual(prev => ({
                  ...prev,
                  informacoesBasicas: {
                    ...prev.informacoesBasicas,
                    genero: genero,
                  },
                }));
                setTelaAtual('onboarding_basico_altura');
              }}
              onVoltar={() => setTelaAtual('onboarding_basico_ano')}
            />
          </div>

          {/* Seção 9: Informações Básicas - Passo 5 (Altura) */}
          <div className="w-full min-w-full flex-shrink-0 min-h-screen">
            <OnboardingBasicoAltura
              usuarioId={usuarioAtual.id || ''}
              alturaInicial={usuarioAtual.informacoesBasicas?.altura || 175}
              onAvancar={(altura) => {
                setUsuarioAtual(prev => ({
                  ...prev,
                  informacoesBasicas: {
                    ...prev.informacoesBasicas,
                    altura: altura,
                  },
                }));
                setTelaAtual('onboarding_basico_peso');
              }}
              onVoltar={() => setTelaAtual('onboarding_basico_genero')}
            />
          </div>

          {/* Seção 10: Informações Básicas - Passo 6 (Peso & IMC) */}
          <div className="w-full min-w-full flex-shrink-0 min-h-screen">
            <OnboardingBasicoPeso
              usuarioId={usuarioAtual.id || ''}
              altura={usuarioAtual.informacoesBasicas?.altura || 175}
              pesoInicial={usuarioAtual.informacoesBasicas?.peso || 80.0}
              onAvancar={(peso, imc) => {
                setUsuarioAtual(prev => ({
                  ...prev,
                  informacoesBasicas: {
                    ...prev.informacoesBasicas,
                    peso: peso,
                    imc: imc,
                  },
                }));
                setTelaAtual('onboarding_basico_peso_desejado');
              }}
              onVoltar={() => setTelaAtual('onboarding_basico_altura')}
            />
          </div>

          {/* Seção 11: Informações Básicas - Passo 7 (Peso Desejado) */}
          <div className="w-full min-w-full flex-shrink-0 min-h-screen">
            <OnboardingBasicoPesoDesejado
              usuarioId={usuarioAtual.id || ''}
              altura={usuarioAtual.informacoesBasicas?.altura || 175}
              pesoAtual={usuarioAtual.informacoesBasicas?.peso || 80.0}
              pesoDesejadoInicial={usuarioAtual.informacoesBasicas?.pesoDesejado || 66.0}
              onAvancar={(pesoDesejado) => {
                setUsuarioAtual(prev => ({
                  ...prev,
                  informacoesBasicas: {
                    ...prev.informacoesBasicas,
                    pesoDesejado: pesoDesejado,
                  },
                }));
                setTelaAtual('onboarding_basico_previsao');
              }}
              onVoltar={() => setTelaAtual('onboarding_basico_peso')}
            />
          </div>

          {/* Seção 12: Informações Básicas - Passo 8 (Previsão de Perda de Peso) */}
          <div className="w-full min-w-full flex-shrink-0 min-h-screen">
            <OnboardingBasicoPrevisao
              usuarioId={usuarioAtual.id || (typeof window !== 'undefined' ? (localStorage.getItem('jejuar_usuario_id') || '') : '')}
              pesoAtual={usuarioAtual.informacoesBasicas?.peso || 72.4}
              pesoDesejado={usuarioAtual.informacoesBasicas?.pesoDesejado || 66.0}
              informacoesBasicas={usuarioAtual.informacoesBasicas}
              onAvancar={() => {
                setUsuarioAtual(prev => ({
                  ...prev,
                  informacoesBasicas: {
                    ...prev.informacoesBasicas,
                    onboardingCompleto: true,
                  },
                }));
                setTelaAtual('inicio');
              }}
              onVoltar={() => setTelaAtual('onboarding_basico_peso_desejado')}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
