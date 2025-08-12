# Centro Terapêutico Bem-Estar - Sistema de Agendamento

Sistema completo de agendamento online para centro terapêutico, desenvolvido com React, TypeScript, Tailwind CSS e Supabase.

## 🌟 Funcionalidades

### Para Clientes
- ✅ **Visualização de Serviços** - Catálogo completo de terapias disponíveis
- ✅ **Agendamento Online** - Sistema intuitivo de 3 passos (Data → Horário → Dados)
- ✅ **Horários em Tempo Real** - Visualização de disponibilidade atualizada
- ✅ **Sistema de Avaliações** - Clientes podem deixar feedback
- ✅ **Informações Completas** - Localização, contato e redes sociais
- ✅ **Design Responsivo** - Funciona perfeitamente em mobile e desktop

### Para Administradores
- ✅ **Painel Administrativo** - Dashboard completo para gestão
- ✅ **Gerenciamento de Serviços** - Criar, editar e excluir terapias
- ✅ **Controle de Horários** - Configurar dias/horários de funcionamento
- ✅ **Gestão de Agendamentos** - Visualizar e gerenciar reservas
- ✅ **Bloqueio de Horários** - Bloquear/liberar slots específicos
- ✅ **Relatórios** - Análises de clientes e receita
- ✅ **Moderação de Avaliações** - Aprovar/excluir comentários

## 🚀 Tecnologias Utilizadas

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS com animações customizadas
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **Icons**: Lucide React
- **Maps**: Google Maps API
- **Deploy**: Netlify Ready

## 📦 Instalação

1. **Clone o repositório**
```bash
git clone https://github.com/seu-usuario/centro-terapeutico.git
cd centro-terapeutico
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais:
```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
```

4. **Configure o banco de dados**
- Execute as migrations na ordem em `supabase/migrations/`
- Ou use o Supabase CLI: `supabase db reset`

5. **Execute o projeto**
```bash
npm run dev
```

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais
- `salons` - Informações do estabelecimento
- `services` - Catálogo de serviços/terapias
- `customers` - Dados dos clientes
- `bookings` - Agendamentos realizados
- `booking_services` - Serviços por agendamento
- `working_hours` - Horários de funcionamento
- `slots` - Controle de disponibilidade
- `reviews` - Avaliações dos clientes

### Segurança
- **Row Level Security (RLS)** habilitado em todas as tabelas
- **Políticas específicas** para clientes e administradores
- **Autenticação** via Supabase Auth

## 🎨 Design System

### Cores Principais
- **Primary**: Azul clínico (`clinic-500: #0ea5e9`)
- **Secondary**: Tons de azul complementares
- **Success**: Verde para confirmações
- **Warning**: Amarelo para alertas
- **Error**: Vermelho para erros

### Componentes
- **Modais** responsivos com animações
- **Cards** com hover effects
- **Botões** com gradientes e micro-interações
- **Forms** com validação em tempo real

## 📱 Responsividade

O sistema foi desenvolvido com **Mobile First**:
- ✅ **Mobile** (320px+)
- ✅ **Tablet** (768px+)
- ✅ **Desktop** (1024px+)
- ✅ **Large Desktop** (1280px+)

## 🔧 Scripts Disponíveis

```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build para produção
npm run preview      # Preview do build
npm run lint         # Verificar código
```

## 🚀 Deploy

### Netlify (Recomendado)
1. Conecte seu repositório GitHub ao Netlify
2. Configure as variáveis de ambiente
3. Deploy automático a cada push

### Outras Plataformas
- **Vercel**: Suporte nativo para Vite
- **Railway**: Deploy com banco incluído
- **Heroku**: Com buildpack para Node.js

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Contato

**Centro Terapêutico Bem-Estar**
- 📱 WhatsApp: (69) 99283-9458
- 📧 Email: centroobemestar@gmail.com
- 📍 Endereço: Avenida Curitiba, nº 3886, Jardim das Oliveiras, Vilhena – RO
- 📱 Instagram: [@centroterapeuticoo](https://instagram.com/centroterapeuticoo)
- 📘 Facebook: [Centro Terapêutico](https://www.facebook.com/share/1Dr82JT5NV/)

---

**Desenvolvido com ❤️ pela [NEXLA](https://www.instagram.com/nexla_ia/) - Automação e IA**