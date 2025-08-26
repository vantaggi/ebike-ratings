# E-Bike Ratings - Design System "Racing Velocity"

Questo documento definisce l'identità visiva del sito. L'estetica "Racing Velocity" si ispira al mondo delle competizioni e-bike: è tecnica, precisa, veloce e aggressiva.

## 1. Principi del Design

* **Gerarchia Assoluta:** L'informazione più importante (il punteggio) deve essere l'elemento più visibile nella pagina.
* **Contrasto e Leggibilità:** Colori scuri per le superfici, accenti vibranti per i dati e le azioni, garantendo sempre la massima leggibilità.
* **Dinamismo e Velocità:** Le linee, le forme e le animazioni devono suggerire movimento e precisione tecnica.

## 2. Sistema di Colori (Palette "Racing Red")

La palette definita nel `style.css` è un'ottima base. La formalizziamo qui.

* **Sfondo Principale:** `var(--color-surface)` - #141218 (Nero tecnico)
* **Superfici/Container:** `var(--color-surface-container-low)` - #1C1B1F (Grigio scuro)
* **Colore Primario (Accenti, Link, Bottoni):** `var(--color-primary)` - #FF453A (Rosso Corsa)
* **Colore Secondario (Badge Valutazione):** `var(--color-tertiary)` - #FFB86C (Arancione Vibrante)
* **Testo Primario:** `var(--color-on-surface)` - #E6E1E5 (Bianco sporco)
* **Testo Secondario:** `var(--color-on-surface-variant)` - #C9C5D0 (Grigio chiaro)

**Regola:** Non usare mai colori hardcoded. Utilizzare sempre le variabili CSS.

## 3. Sistema Tipografico

Useremo il font **Roboto** (già importato) per la sua eccellente leggibilità e versatilità.

* **Titoli (H1, H2):** `Roboto Bold`, uppercase, con un leggero `letter-spacing` per un look tecnico.
* **Nomi Modello (in tabella):** `Roboto Medium`.
* **Corpo del testo:** `Roboto Regular`.

## 4. Forme e Iconografia

* **Border Radius:** Utilizziamo raggi ampi per i container (`16px`) e i bottoni (`28px`) per un look moderno e organico, come si vede nelle carene delle moto da corsa.
* **Iconografia:** Le icone devono essere leggere e tecniche. Raccomando l'uso di un set come **Feather Icons** o **Material Symbols (Sharp)** per la loro estetica pulita e precisa.

## 5. Animazioni e Micro-interazioni

* **Hover:** Gli elementi interattivi (righe delle tabelle, link) devono avere un feedback visivo immediato (es. cambio di sfondo o luminosità).
* **Caricamento Dati:** Implementare uno scheletro di caricamento (shimmer effect) per le tabelle mentre i dati vengono caricati dal file JSON, per migliorare la UX percepita.
