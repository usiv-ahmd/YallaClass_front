# Mobile style layer

Mobile styling for Yalla Class. **Nothing in this folder changes the desktop
sheets** in `src/styles/*.css` — those files are never edited. This folder only
_adds_ overrides that apply below the mobile breakpoint.

## How it is wired

`src/main.jsx` imports it once, as the last CSS import:

```js
import './styles/global.css';
import App from './App';
import './styles/mobile/mobile.css'; // ← the whole mobile layer, one line
```

Import order matters: media queries add **no** specificity, so the mobile rules
win only because they come _after_ the desktop rules in the final bundle.
Keep the import after `import App`.

Delete that single line and the app goes back to the desktop-only design. No
other file has to change.

## Breakpoints

| Width      | What happens                                                       |
| ---------- | ------------------------------------------------------------------ |
| `> 768px`  | Desktop. This folder is completely inactive.                       |
| `≤ 768px`  | Phone / small tablet layout: one column, sidebar under the content. |
| `≤ 420px`  | Small phones: tighter type, the attendance table drops 3 columns.  |
| `≤ 900px` and `≤ 500px` high, landscape | Phones sideways: vertical chrome is trimmed. |

To move a breakpoint, change the value in the partials (`768px` / `420px`) and
in `mobile.css`'s header comment.

## Files

Loaded in this order by `mobile.css`:

| File                    | Mirrors                              | Covers                                                                 |
| ----------------------- | ------------------------------------ | ---------------------------------------------------------------------- |
| `01-base.css`           | `global.css` (shell)                 | shadow/radius tokens, page, layout, sidebar, cards, buttons, forms, `.main-screen`, progress bar, hover-off-on-touch |
| `02-live-question.css`  | `global.css` §9                      | the big question card shared by student and instructor                 |
| `03-landing-auth.css`   | `landing.css`, `auth.css`            | landing page, login, register, join screen                             |
| `04-instructor.css`     | `Instructor-page.css`                | dashboard, questions panel, upload, live controls, attendance table, question form |
| `05-student.css`        | `student-page.css`, `reactions.css`  | answer results, leaderboard sidebar, podium                            |
| `06-modals.css`         | `global.css` §6, `loading.css`       | dialogs (centred, scroll inside) and the loading card                  |

## Conventions

- **Every rule must stay inside a `@media` block.** A rule outside one would
  leak to desktop. Keep the file structure as `@media (…) { … }` only.
- Override the same selectors the desktop files use; don't add new class
  names, because the JSX doesn't have them.
- Prefer the design tokens (`--yalla-shadow`, `--yalla-radius`, …) over
  re-declaring every property: `01-base.css` re-scales them once for the whole
  app at phone size.
- Text inputs are forced to `font-size: 16px` on purpose — iOS Safari zooms the
  page when a focused input is smaller than that.
- The attendance table keeps all 9 columns and scrolls sideways from 421–768px
  (with a slim scrollbar as the affordance). At ≤420px the three least used
  columns (`Streak`, `انتهى وقتها`, `غاب عنها`) are hidden so it fits without
  sideways scrolling; the CSV export still contains them.

## Quick check

Run `pnpm build && pnpm preview`, then open the site at width 390px and 1440px.
The 1440px view must look exactly as before — if it changed, a rule escaped its
`@media` block.
