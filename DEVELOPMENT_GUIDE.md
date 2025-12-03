# 📚 Guia de Desenvolvimento - Central HUB

## Visão Geral da Arquitetura

Este guia documenta **o que cada arquivo controla** e **como fazer alterações** para adicionar novas funcionalidades.

---

## 🗂️ Estrutura de Arquivos e Responsabilidades

### **TIPOS E INTERFACES** (`src/types/`)

#### `widgets.ts`
**Responsável por:** Definir tipos de widgets e suas propriedades
- **O que controla:**
  - Tipos de widgets suportados: `weather`, `clock`, `text`
  - Propriedades de cada widget: tamanho, posição, rotação, animações
  - Configuração de texto: tamanho da fonte, cor, animação (scroll-left)

**Para adicionar um novo tipo de widget:**
1. Abra `src/types/widgets.ts`
2. Adicione um novo tipo na union: `type WidgetType = "weather" | "clock" | "text" | "seu_novo_tipo"`
3. Crie uma interface específica: `interface SeuNovoWidgetConfig extends BaseWidgetConfig { ... }`
4. Atualize `WIDGET_DEFAULTS` com valores padrão para o novo tipo
5. O sistema carregará automaticamente

**Exemplo:**
```typescript
type WidgetType = "weather" | "clock" | "text" | "video";

interface VideoWidgetConfig extends BaseWidgetConfig {
  videoUrl: string;
  autoPlay: boolean;
  loop: boolean;
}
```

---

### **COMPONENTES** (`src/components/`)

#### `WeatherAnimations.tsx` ⭐ NOVO
**Responsável por:** Renderizar animações de clima em SVG
- **O que controla:**
  - 6 tipos de clima com animações (Clear, Clouds, Rain, Snow, Thunderstorm, Default)
  - Velocidade das animações (via `@keyframes`)
  - Cores e gradientes de fundo para cada clima
  - Efeitos SVG (drop-shadow para raios, etc)

**Para adicionar um novo tipo de clima:**
1. Abra `src/components/WeatherAnimations.tsx`
2. Adicione um novo `case` na função `WeatherAnimations()`:
   ```typescript
   case "fog":
     return <FogAnimation className={className} />;
   ```
3. Crie um novo componente SVG (ex: `FogAnimation`)
4. Defina `@keyframes` para animações dentro do `<style>`
5. Retorne SVG com elementos animados

**Exemplo de nova animação:**
```typescript
const FogAnimation: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 800 600" className={`w-full h-full ${className}`}
       style={{ background: "linear-gradient(180deg, #888 0%, #AAA 100%)" }}>
    <defs>
      <style>{`
        @keyframes fogDrift {
          0% { opacity: 0.3; transform: translateX(-50px); }
          50% { opacity: 0.6; }
          100% { opacity: 0.3; transform: translateX(50px); }
        }
        .fog { animation: fogDrift 8s ease-in-out infinite; }
      `}</style>
    </defs>
    {/* Elementos SVG com class="fog" */}
  </svg>
);
```

---

#### `WeatherWidget.tsx`
**Responsável por:** Exibir widget de clima com previsão e animação de fundo
- **O que controla:**
  - Busca de dados meteorológicos (OpenWeatherMap ou Open-Meteo)
  - Formatação de temperatura, umidade, velocidade do vento
  - Seleção de qual animação renderizar (baseado em `weather.main`)
  - Layout do widget (tamanho, posição do texto, ícone)

**Para alterar aparência do widget:**
1. Abra `src/components/WeatherWidget.tsx`
2. Modifique a seção de **renderização** (linha ~150):
   ```typescript
   <div className="relative z-10 flex flex-col items-center justify-center w-full h-full">
     {/* Altere aqui: tamanho do texto, cores, disposição */}
     <div className="text-5xl font-bold mb-2 drop-shadow-lg text-white">
       {weather.temp}°C
     </div>
   </div>
   ```

**Para adicionar novo tipo de API:**
1. Procure a seção de `fetchWeather()` (linha ~50)
2. Adicione um novo `else if` antes do último `else`:
   ```typescript
   else if (apiKey === "sua_api") {
     // Sua lógica de fetch
   }
   ```

**Para adicionar novos dados (ex: UV Index):**
1. Adicione campo na interface `WeatherData`: `uvIndex: number;`
2. Inclua no fetch: `uvIndex: data.main.uvi || 0`
3. Renderize no JSX: `<div>UV: {weather.uvIndex}</div>`

---

#### `Clock.tsx`
**Responsável por:** Exibir relógio digital em tempo real
- **O que controla:**
  - Atualização de hora (a cada segundo)
  - Formato 24h ou 12h
  - Tamanho e estilo da fonte
  - Timezone

**Para alterar formato de hora:**
1. Abra `src/components/Clock.tsx` (linha ~30)
2. Modifique a formatação:
   ```typescript
   // Formato 24h
   const timeString = date.toLocaleTimeString("pt-BR", { hour24: true });
   
   // Formato 12h com AM/PM
   const timeString = date.toLocaleTimeString("pt-BR", { hour12: true });
   ```

**Para adicionar segundos:**
1. Inclua no return JSX:
   ```typescript
   <div className="text-5xl font-bold text-white drop-shadow-lg">
     {timeString} <span className="text-2xl">{seconds}</span>
   </div>
   ```

---

#### `LayoutEditor.tsx` 🔧 PRINCIPAL
**Responsável por:** Interface de edição de layouts e zonas
- **O que controla:**
  - Criação/edição de zonas (posição, tamanho, rotação)
  - Management de timeline por zona
  - Adição de widgets
  - Salvamento em Supabase
  - **NOVO:** Panel lateral para edição inline (Sheet)

**Para adicionar novo controle de zona:**
1. Abra `src/components/LayoutEditor.tsx`
2. Procure a seção "Editar Zona" (linha ~330)
3. Adicione novo input/select:
   ```typescript
   <div>
     <label className="text-xs text-muted-foreground">Opacidade (%)</label>
     <Input
       type="number"
       min="0"
       max="100"
       value={localData.zones[selectedZoneIndex].opacity || 100}
       onChange={(e) => updateZone(selectedZoneIndex, { opacity: Number(e.target.value) })}
     />
   </div>
   ```

**Para modificar o Sheet lateral:**
1. Procure `{/* Zone Edit Sheet */}` (linha ~625)
2. Altere conteúdo dentro de `<SheetContent>`
3. As mudanças aparecerão ao clicar em zona no preview

**Para salvar novos campos:**
1. Adicione campo na interface `Zone` (linha ~23):
   ```typescript
   interface Zone {
     // ... campos existentes
     opacity?: number;
   }
   ```
2. O `handleSave()` salvará automaticamente em `layout_data`

---

#### `LayoutEditorPreview.tsx`
**Responsável por:** Renderização em tempo real do layout no canvas
- **O que controla:**
  - Visualização das zonas
  - Exibição de imagens/vídeos na zona
  - Drag-and-drop de arquivos
  - Transformações de rotação (CSS)
  - Overlay de widgets

**Para modificar visual das zonas:**
1. Abra `src/components/LayoutEditorPreview.tsx` (linha ~80)
2. Altere className do container da zona:
   ```typescript
   className={`absolute border-2 transition-colors cursor-pointer ${
     isSelected ? "border-primary bg-primary/10" : "border-muted hover:border-primary/50 bg-white/5"
   }`}
   ```

**Para alterar como arquivos são exibidos:**
1. Procure a seção `{file ? (...)` (linha ~95)
2. Modifique a renderização da imagem:
   ```typescript
   <img
     src={file.file_url}
     alt={file.name}
     style={{
       width: "100%",
       height: "100%",
       objectFit: "cover", // ou "contain", "fill", etc
       transform: `rotate(${(currentItem as any)?.rotation || 0}deg) scale(1.2)`,
     }}
   />
   ```

**Para adicionar novo tipo de feedback visual:**
1. Procure `onDragOver` (linha ~75)
2. Modifique feedback:
   ```typescript
   onDragOver={(e) => {
     e.currentTarget.style.opacity = "0.5"; // era 0.7
     e.currentTarget.style.borderColor = "red"; // novo
   }}
   ```

---

#### `WidgetPreview.tsx`
**Responsável por:** Renderizar preview de cada widget no canvas
- **O que controla:**
  - Qual componente renderizar (Weather, Clock, Text)
  - Aplicação de rotação CSS
  - Tamanho e posição (percentual)
  - Overlay de widgets no canvas

**Para alterar como widgets são exibidos:**
1. Abra `src/components/WidgetPreview.tsx` (linha ~40)
2. Modifique o container:
   ```typescript
   style={{
     // ... posição e tamanho
     transform: `rotate(${widget.rotation || 0}deg) scale(1.1)`, // novo scale
     opacity: 0.9, // novo: ajuste opacidade
   }}
   ```

**Para adicionar novo tipo de widget na renderização:**
1. Procure o switch statement (linha ~50)
2. Adicione case:
   ```typescript
   case "seu_widget":
     return <SeuWidgetComponent config={widget} />;
   ```

---

#### `WidgetManager.tsx`
**Responsável por:** Gerenciar lista de widgets (add, edit, remove)
- **O que controla:**
  - Criação de novo widget
  - Edição de propriedades
  - Remoção de widget
  - Seleção para edição

**Para adicionar novo campo editável:**
1. Abra `src/components/WidgetManager.tsx`
2. Procure a seção de inputs (linha ~100)
3. Adicione novo input:
   ```typescript
   <div>
     <label>Transparência</label>
     <input
       type="range"
       min="0"
       max="1"
       step="0.1"
       value={selectedWidget.opacity || 1}
       onChange={(e) => updateWidget({ opacity: Number(e.target.value) })}
     />
   </div>
   ```

---

#### `TextWidgetConfig.tsx`
**Responsável por:** Editor de propriedades de texto (fonte, tamanho, cor, animação)
- **O que controla:**
  - Texto a exibir
  - Tamanho da fonte
  - Cor do texto
  - Tipo de animação (scroll-left, etc)
  - Velocidade de animação

**Para adicionar nova animação de texto:**
1. Abra `src/components/TextWidgetConfig.tsx`
2. Procure o select de animações (linha ~70)
3. Adicione novo option:
   ```typescript
   <option value="pulse">Piscar</option>
   <option value="bounce">Quicar</option>
   ```

**Para criar a animação no TextWidget:**
1. Abra `src/components/TextWidget.tsx`
2. Procure `@keyframes` (linha ~15)
3. Adicione nova animação:
   ```typescript
   @keyframes pulse {
     0%, 100% { opacity: 1; }
     50% { opacity: 0.5; }
   }
   ```

---

#### `Player.tsx` 🎬 REPRODUTOR
**Responsável por:** Reproduzir layouts e timelines em tempo real
- **O que controla:**
  - Reprodução de timelines de zona
  - Sincronização de conteúdo
  - Intervalo de atualização (zona e widgets)
  - Rotação automática entre itens

**Para alterar timing de exibição:**
1. Abra `src/components/Player.tsx`
2. Procure `playbackDuration` (linha ~80)
3. Modifique lógica de intervalo:
   ```typescript
   // Se duração < 2 segundos, mínimo 2s
   const playbackDuration = Math.max(currentItem?.duration || 5, 2) * 1000;
   ```

**Para adicionar efeito de transição:**
1. Procure onde renderiza zona (linha ~130)
2. Adicione classe de transição:
   ```typescript
   className="transition-all duration-500" // novo
   style={{ opacity: fadeOut ? 0 : 1 }} // novo
   ```

---

### **PÁGINAS** (`src/pages/`)

#### `Layouts.tsx`
**Responsável por:** Lista e gerenciamento de layouts
- **O que controla:**
  - Exibição de layouts cadastrados
  - Botões de ação (editar, duplicar, deletar)
  - Criação de novo layout
  - Filtros/busca

**Para adicionar novo botão de ação:**
1. Abra `src/pages/Layouts.tsx` (linha ~150)
2. Adicione novo botão em cada layout:
   ```typescript
   <Button
     size="sm"
     onClick={() => exportLayout(layout.id)}
   >
     Exportar
   </Button>
   ```

---

#### `Player.tsx` (página)
**Responsável por:** Visualização em tela cheia do player
- **O que controla:**
  - Modo fullscreen
  - Auto-refresh de playlists
  - Exibição de debug info

**Para adicionar informações de debug:**
1. Procure seção de info (linha ~200)
2. Adicione novo debug:
   ```typescript
   <div className="text-xs">
     Zona Atual: {currentZoneIndex} | Item: {itemIndex}/{totalItems}
   </div>
   ```

---

### **HOOKS** (`src/hooks/`)

#### `use-mobile.tsx`
**Responsável por:** Detectar se dispositivo é mobile
- **O que controla:**
  - Breakpoint responsivo (768px)
  - Renderização condicional para mobile

**Para adicionar novo breakpoint:**
1. Abra `src/hooks/use-mobile.tsx`
2. Modifique valor de `768`:
   ```typescript
   const isMobile = useMediaQuery("(max-width: 1024px)"); // Para tablet
   ```

---

### **INTEGRAÇÕES** (`src/integrations/`)

#### `supabase/client.ts`
**Responsável por:** Inicialização do Supabase
- **O que controla:**
  - URL do projeto Supabase
  - Chave pública (anon key)
  - Configurações de cliente

**Para conectar outro projeto:**
1. Abra `src/integrations/supabase/client.ts`
2. Altere URL e chave:
   ```typescript
   const supabase = createClient(
     "https://seu-projeto.supabase.co",
     "sua-anon-key"
   );
   ```

---

## 🔄 Fluxo de Dados

```
Layouts (DB) 
    ↓
LayoutEditor.tsx (edita)
    ↓
LayoutEditorPreview.tsx (renderiza)
    ↓
Player.tsx (reproduz)
```

**Estrutura de dados:**
```typescript
Layout {
  id: string
  name: string
  layout_data: {
    zones: [
      {
        id, x%, y%, width%, height%, rotation, timeline: [
          { id, duration, file_id, rotation }
        ]
      }
    ]
    widgets: [
      { id, type, x%, y%, width%, height%, rotation, config: {...} }
    ]
  }
}
```

---

## 📝 Exemplos Práticos

### Adicionar novo tipo de widget

1. **Em `src/types/widgets.ts`:**
   ```typescript
   type WidgetType = "weather" | "clock" | "text" | "rss";
   
   interface RSSWidgetConfig extends BaseWidgetConfig {
     feedUrl: string;
     itemsToShow: number;
     scrollSpeed: number;
   }
   ```

2. **Criar `src/components/RSSWidget.tsx`:**
   ```typescript
   export function RSSWidget({ config }: { config: RSSWidgetConfig }) {
     const [items, setItems] = useState([]);
     
     useEffect(() => {
       // Fetch RSS feed
     }, [config.feedUrl]);
     
     return <div className="...">RSS Items</div>;
   }
   ```

3. **Adicionar case em `WidgetPreview.tsx`:**
   ```typescript
   case "rss":
     return <RSSWidget config={widget as RSSWidgetConfig} />;
   ```

4. **Em `WidgetManager.tsx`, adicionar editor**

---

### Alterar layout de zona

1. **Em `LayoutEditorPreview.tsx`**, mudar `objectFit`:
   ```typescript
   objectFit: "contain" // era "cover"
   ```

2. **Salva automaticamente** quando clicar fora

---

### Adicionar nova animação de clima

1. **Em `WeatherAnimations.tsx`**, adicionar case e componente
2. **Testar** verificando se a previsão retorna o tipo de clima
3. **Sincronizar** em `WeatherWidget.tsx` se necessário

---

## 🐛 Debugging

### Ver dados salvos em Supabase:
```javascript
// No DevTools Console
localStorage.setItem("debug_layouts", JSON.stringify(layouts));
```

### Testar fetch de clima:
```javascript
fetch(`https://api.openweathermap.org/data/2.5/weather?q=SaoPaulo&appid=YOUR_KEY`)
  .then(r => r.json())
  .then(data => console.log(data.weather[0].main));
```

---

## 🚀 Resumo Rápido

| Arquivo | Altera | Como |
|---------|--------|------|
| `widgets.ts` | Tipos de widgets | Adicionar ao union type |
| `WeatherAnimations.tsx` | Tipos de clima | Adicionar case + componente SVG |
| `WeatherWidget.tsx` | Aparência clima | Modificar JSX renderizado |
| `Clock.tsx` | Formato de hora | Alterar `toLocaleTimeString()` |
| `LayoutEditor.tsx` | Controles de zona | Adicionar inputs em seção "Editar Zona" |
| `LayoutEditorPreview.tsx` | Visual do canvas | Modificar className/style das divs |
| `WidgetPreview.tsx` | Como widgets aparecem | Modificar transform/style |
| `WidgetManager.tsx` | Editor de widgets | Adicionar novos inputs |
| `Player.tsx` | Reprodução | Alterar timing/transitions |

---

## 📞 Próximos Passos

- ✅ Sistema de widgets completo
- ✅ Animações de clima
- ✅ Edição inline
- 🔄 Em desenvolvimento: Sugestões?

---

**Última atualização:** 3 de dezembro de 2025
**Versão:** 1.0 (Production Ready)
