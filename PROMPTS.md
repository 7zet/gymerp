# Sport ERP: Claude Code promptlari

## Boshlashdan oldin

1. Bo'sh loyiha papkasi oching va shu to'plamni uning ichiga nusxalang, yashirin `.claude` papkasi ham tushsin.
2. `git init` qiling, keyin Claude Code'ni shu papkada ishga tushiring va papkaga ishonish oynasini tasdiqlang. Tasdiqlanmasa, ruxsatlar qo'llanmaydi.
3. Har bir qadamni quyidagicha bajaring:

```text
/clear
/model <jadvaldagi model>
<qadam prompti>
```

Qadam tugagach, natijani tekshiring va keyingisiga o'ting. `/clear` qilish qo'rqinchli emas: kerakli ma'lumot fayllarda va git'da saqlanadi.

## Qadamlar

Qo'shimcha izoh yozish shart emas, qoidalar `CLAUDE.md` va spec fayllarda bor.

### 1-bosqich: Foundation

| Qadam | Model | Prompt |
|---|---|---|
| 1.1 Monorepo | sonnet | `Do step 1.1 from docs/stages/S1-foundation.md.` |
| 1.2 Baza va tenant himoyasi | opus | `Do step 1.2 from docs/stages/S1-foundation.md.` |
| 1.3 Auth va RBAC | sonnet | `Do step 1.3 from docs/stages/S1-foundation.md.` |
| 1.4 Web va klub boshqaruvi | sonnet | `Do step 1.4 from docs/stages/S1-foundation.md.` |

### 2-bosqich: CRM va jadval

| Qadam | Model | Prompt |
|---|---|---|
| 2.1 Sportchi va vasiy | sonnet | `Do step 2.1 from docs/stages/S2-crm.md.` |
| 2.2 Guruh, murabbiy, jadval | sonnet | `Do step 2.2 from docs/stages/S2-crm.md.` |
| 2.3 Import va demo | sonnet | `Do step 2.3 from docs/stages/S2-crm.md.` |

### 3-bosqich: Billing va kassa

| Qadam | Model | Prompt |
|---|---|---|
| 3.1 Hisoblash dvigateli | opus | `Do step 3.1 from docs/stages/S3-billing.md. Write the tests first.` |
| 3.2 Tarif va abonement | sonnet | `Do step 3.2 from docs/stages/S3-billing.md.` |
| 3.3 To'lov va storno | opus | `Do step 3.3 from docs/stages/S3-billing.md. Prove the concurrency cases with real tests.` |
| 3.4 Kassa ekranlari | sonnet | `Do step 3.4 from docs/stages/S3-billing.md.` |

### 4-bosqich: Operatsiyalar

| Qadam | Model | Prompt |
|---|---|---|
| 4.1 Davomat va PWA | sonnet | `Do step 4.1 from docs/stages/S4-operations.md.` |
| 4.2 Xarajat va ish haqi | opus | `Do step 4.2 from docs/stages/S4-operations.md.` |
| 4.3 Hisobot va dashboard | sonnet | `Do step 4.3 from docs/stages/S4-operations.md.` |

### 5-bosqich: Bot va ishga tushirish

| Qadam | Model | Prompt |
|---|---|---|
| 5.1 Job va xabar yetkazish | sonnet | `Do step 5.1 from docs/stages/S5-launch.md.` |
| 5.2 Telegram bot | sonnet | `Do step 5.2 from docs/stages/S5-launch.md.` |
| 5.3 Qabul testlari va staging | sonnet | `Do step 5.3 from docs/stages/S5-launch.md.` |

## Bosqich oxiridagi tekshiruv

Har bosqichdan keyin bir marta, yangi sessiyada ishlating:

```text
/clear
/model opus
Audit stage N: compare the git diff since the stage began with the Accept lines in docs/stages/<file>. Check tests, do not re-read unrelated code. Report only failures and invariant violations, as file:line plus one-line fix. Do not edit.
```

Topilganlarni tuzatish uchun:

```text
/clear
/model sonnet
Fix these audit findings, then run the affected tests: <topilmalarni shu yerga qo'ying>
```

## Vaziyatga qarab ishlatiladigan promptlar

Yarim qolgan qadamni davom ettirish:

```text
/clear
Continue step X.Y. Check git status and git diff to see what is done, then finish the Accept items only.
```

Xatoni tuzatish:

```text
Fix: <xato qisqacha yoki faqat kerakli qatorlar>. Likely in <fayl>. Change the minimum, run that test only.
```

Yangi talab qo'shish:

```text
Update docs/stages/<file> step X.Y with this rule: <qoida>. Then implement only the difference.
```

Sessiya uzayib ketganda, qadam tugamagan bo'lsa:

```text
/compact Keep step ID, unfinished Accept items, changed file paths, unresolved errors.
```

## Token tejash qoidalari

- **Bitta sessiyada bitta qadam.** Qadam almashganda `/clear` qiling, chunki eski suhbat har keyingi so'rov bilan qayta yuboriladi.
- **Model qat'iy jadval bo'yicha.** Opus faqat tenant himoyasi va pul hisob-kitobida ishlatiladi, qolganiga Sonnet yetadi.
- **Log'ni butun tashlamang.** Faqat xato qatorlari va fayl nomini yuboring.
- **Fayl nomini ayting.** "Xatoni top" o'rniga "`payments.service.ts` da xato" deb yozing, shunda Claude butun loyihani qidirmaydi.
- **Noto'g'ri yo'lni tuzatib o'tirmang.** Natija noto'g'ri ketsa, `/rewind` qilib aniqroq prompt bering.
- **O'lchab boring.** `/context` nima joy egallayotganini, `/cost` yoki `/usage` sarfni ko'rsatadi.
- **`CLAUDE.md` ni kichik saqlang.** U har so'rov bilan ketadi, shuning uchun yangi qoidani tegishli spec fayliga yozing.
