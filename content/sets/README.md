# Set questions

Put a set's questions here to let members answer it **inside the site** (instant
feedback, saved progress, results and retakes). A set without a file here keeps
opening its Google Form.

## 1. Make the spreadsheet

One row per question, with these column headings in the first row:

| question | a | b | c | d | answer | explanation |
| --- | --- | --- | --- | --- | --- | --- |
| Which color scheme uses three hues spaced equally around the color wheel? | Analogous | Complementary | Triadic | Split-complementary | C | Triadic schemes use three hues 120° apart… |

- **answer** is the letter of the right choice (A, B, C…). The exact choice text also works.
- **explanation** is optional. It's shown after the member answers.
- Two to six choices: add **e** and **f** columns if you need them, or leave **c**/**d** empty.
- Commas, quotes and line breaks inside a cell are fine.

`example.csv` in this folder is a small working example (it appears as "Example set" when
you run the site on your computer, never on the live site).

## 2. Save it as CSV, named after the set

Google Sheets: **File → Download → Comma-separated values (.csv)**.
Excel: **File → Save As → CSV UTF-8**.

Name the file after the set's slug and put it in this folder:

| Set | File name |
| --- | --- |
| IDLE Free Starter Set | `free-starter.csv` |
| History of Interior Design Part 1–5 | `history-1.csv` … `history-5.csv` |
| Materials of Decoration Part 1–2 | `materials-1.csv`, `materials-2.csv` |
| Building Construction and Utilities Part 1–2 | `construction-1.csv`, `construction-2.csv` |
| Furniture Design and Construction | `furniture.csv` |
| Professional Practice and Ethics | `professional-practice.csv` |
| Color Theory | `color-theory.csv` |

The list of sets, their titles, order and Google Form links live in `lib/sets.ts`.

## 3. Check it, then publish

Run `npm run dev` and open http://localhost:3000/members/sets. If any rows were skipped
(say, a missing answer), a box at the top lists them with their row numbers. Then commit
and push; Vercel deploys it.

## Editing a set later

Members' progress is matched to each question by its text. Adding, removing or
reordering questions is fine. If you fix the wording of a question, anyone who already
answered it in an unfinished run will see it as a new question; finished results only
show questions that still exist.
