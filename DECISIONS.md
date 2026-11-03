# Sport ERP: yakuniy qarorlar (TZ v1.1 uchun)

Bu hujjat TZ v1.0 dagi ochiq savollar va bo'shliqlarga tanlangan javoblarni jamlaydi.
"Sozlama" deb belgilanganlarini klub kod o'zgartirmasdan almashtira oladi.
"Qat'iy" deb belgilanganlarini keyin o'zgartirish qimmat, shuning uchun ular arxitekturaga kiritilgan.

## Arxitektura (qat'iy)

| Mavzu | Qaror | Sabab |
|---|---|---|
| Arxitektura | Modulli monolit, pnpm monorepo | Bu hajm uchun eng tez va arzon |
| Backend | NestJS, TypeScript | Modullarga bo'lish qulay, frontend bilan bitta til |
| Frontend | Next.js, Tailwind, shadcn/ui, TanStack Query | Admin panel va PWA uchun tez |
| Baza | PostgreSQL, Drizzle ORM | RLS va tranzaksiyalarni to'liq boshqarish oson |
| Tenant himoyasi | Server tekshiruvi va PostgreSQL RLS | Bitta xato klub ma'lumotini ochib qo'ymasligi uchun |
| Navbat | Redis, BullMQ, outbox jadvali | Xabar xatosi moliyaga ta'sir qilmaydi |
| Xosting | Docker Compose, O'zbekistondagi VPS, S3-mos saqlash | Mahalliy saqlash talabiga moslashish uchun |
| Til | Avval o'zbekcha (lotin), rus tili uchun i18n tayyor | Pilot uchun bitta til yetarli |

## Domen modeli (qat'iy)

| Savol | Qaror |
|---|---|
| Voyaga yetgan sportchi | Vasiy majburiy emas. Sportchi o'ziga kontakt bo'ladi (`relation=self`) va botga o'zi ulanadi |
| Balans kimda | Sportchida. Musbat qiymat qarz, manfiy qiymat avans |
| Bir nechta farzand uchun to'lov | Bitta kvitansiya ichida har farzandga alohida to'lov qatori yoziladi |
| Sportchi va filial | Sportchida asosiy filial bor, admin ko'rish huquqi asosiy filial va guruh a'zoligi bo'yicha |
| Telegram bot | Barcha klublar uchun bitta bot, bir nechta klub bo'lsa tanlash menyusi |
| Telefonni tasdiqlash | Telegram "kontaktni ulashish", kontakt yozuvchining o'ziniki ekani tekshiriladi |
| Xodimlar logini | Telefon va parol. Parolni owner yoki admin bir martalik parol bilan tiklaydi. SMS yo'q |
| Ota-ona kirishi | Faqat bot orqali, MVPda veb kabinet yo'q |
| Superadmin | Klub ichki ma'lumotini ko'rmaydi, faqat umumiy sonlarni ko'radi |
| Klubdan SaaS to'lovi | MVPda `paid_until` qo'lda. Muddat o'tgach 14 kun ogohlantirish, keyin faqat o'qish |

## Abonement

| Savol | Qaror | Turi |
|---|---|---|
| Oy o'rtasida qo'shilish | Qolgan kunlar bo'yicha, 1000 so'mgacha yuqoriga yaxlitlanadi | Sozlama |
| "Kelmadi" darsni sarflaydimi | Ha | Sozlama |
| "Sababli" darsni sarflaydimi | Yo'q | Sozlama |
| Dars paketining muddati | 45 kun | Sozlama |
| Muzlatish | 1 marta, 7-30 kun | Sozlama |
| Muzlatish natijasi | Barcha modelda tugash sanasi muzlatilgan kunlarga suriladi | Qat'iy |
| Kalendar uzaytirish | Avtomatik. Muzlatishdan keyin keyingi davr oy oxirigacha proratsiya bilan hisoblanib, kalendar siklga qaytadi | Sozlama |
| 30 kunlik va dars paketi uzaytirish | Qo'lda | Sozlama |
| Guruh almashtirish | Abonement saqlanadi, narx farqi keyingi davrdan qo'llanadi | Qat'iy |
| Sinov darsi | Sportchi `trial` statusida, 1 ta bepul dars | Sozlama |

## To'lov va kassa

| Savol | Qaror | Turi |
|---|---|---|
| Qarzdor darsga kiradimi | Kiradi, murabbiy faqat belgini ko'radi, summani emas | Sozlama |
| Avans | Yangi qarzning eng eskisiga avtomatik yopiladi | Sozlama |
| Chegirma | Admin 10% gacha sabab bilan, undan yuqorisini owner tasdiqlaydi | Sozlama |
| Oila chegirmasi | MVPda alohida qoida yo'q, sabab kodi bilan oddiy chegirma | Qat'iy |
| To'lov muddati | Kalendar uzaytirishda boshlanishdan 5 kun, boshqa holatda boshlanish sanasi | Sozlama |
| Storno | Admin kun yopilguncha o'z filialida, owner istalgan vaqtda, sabab majburiy | Qat'iy |
| Kun yakuni | Admin kassani sanab yopadi, farq qayd etiladi, owner tasdiqlaydi | Qat'iy |
| Yopilgan kunni tuzatish | Faqat bugungi sana bilan yangi yozuv | Qat'iy |
| Abonementni bekor qilish | Tizim ishlatilmagan qismni hisoblaydi, owner summani tasdiqlaydi | Qat'iy |
| Kassadan pul olish | Egasi olgan pul alohida harakat sifatida yoziladi | Qat'iy |
| Kvitansiya raqami | Filial bo'yicha ketma-ket, masalan `B01-2026-000123` | Qat'iy |

## Davomat

| Savol | Qaror | Turi |
|---|---|---|
| Murabbiy tahrir muddati | 24 soat, keyin admin | Sozlama |
| Davomat o'zgarsa | Dars qoldig'i shu tranzaksiyada qayta hisoblanadi | Qat'iy |
| Limitdan ortiq kelish | Bloklanmaydi, admin ro'yxatiga tushadi | Qat'iy |
| Ota-onaga xabar | Faqat kelmaganda | Sozlama |

## Ish haqi va hisobot

| Savol | Qaror |
|---|---|
| Foiz bazasi | Haqiqiy naqd tushum, to'lov taqsimlangan paytdagi guruh murabbiyi bo'yicha |
| Storno keyingi davrda bo'lsa | Joriy ochiq davrda manfiy summa bo'lib tushadi |
| Bir nechta filial | Har filial uchun alohida ish haqi qoidasi |
| O'rinbosar murabbiy | Dars haqi darsni o'tgan murabbiyga, foiz guruh murabbiyiga |
| Ish haqi va xarajat | To'langan ish haqi avtomatik xarajat bo'ladi, qo'lda "ish haqi" kategoriyasi tanlanmaydi |
| Umumklub xarajati | `branch_id` bo'sh, filial hisobotiga kirmaydi, klub jami hisobotiga kiradi |
| Natija ko'rsatkichi | Ikki alohida ko'rinish: naqd natija va hisoblangan natija |

## Xabarlar va ma'lumot ko'chirish

| Savol | Qaror |
|---|---|
| Botga ulanmagan ota-ona | Xabar yuborilmaydi, SMS yo'q, admin ulanmaganlar ro'yxatini va havolani ko'radi |
| Xabar vaqti | Soat 10:00, klub vaqti bo'yicha. Dars o'zgarishi darhol, lekin 21:00-09:00 oralig'ida emas |
| Excel import | Ha: sportchi, vasiy, guruh va boshlang'ich qarz, avval sinov ko'rinishi bilan |

## Inson tasdiqlashi kerak bo'lgan 3 narsa

Bularni kod hal qilmaydi:

1. **Yuridik:** shaxsiy ma'lumotlarni mahalliy saqlash talabi va ota-ona roziligi matni yurist bilan tekshirilsin.
2. **Pilot:** TZ moliyaviy qoidalar pilot bilan tasdiqlanishini talab qiladi. Shu hujjatdagi qiymatlar MMA klubi bilan pilotdan oldin solishtirilsin. "Sozlama" turidagi farq kodni o'zgartirmaydi, "Qat'iy" turidagi farq esa dasturchi ishini talab qiladi.
3. **Biznes:** SaaS narxi va klub bilan shartnoma alohida kelishiladi.
