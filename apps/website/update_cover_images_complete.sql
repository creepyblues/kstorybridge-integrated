-- SQL script to update title_image column with new cover images from scraped data
-- Generated from toons_kr_enhanced_final.csv
-- Maps english_title from CSV to title_name_en in titles table

-- Method 1: Single UPDATE with CASE statement (more efficient)
UPDATE titles 
SET title_image = CASE title_name_en
    WHEN 'Crush on You' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Fe7fb3fbd-0da9-4f4b-ad21-1e993a85fd77%2F%EC%9E%AC%EB%B0%8C%EB%8B%88%EC%A7%9D%EC%82%AC%EB%9E%91_%EB%A9%94%EC%9D%B8%EB%B0%B0%EB%84%882(720x972).jpg&blockId=26d94fee-bc6c-40ca-bfce-893212ff8a87'
    WHEN 'ex_girlfriend' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2F782801ca-3dcc-4751-8a08-4267aa829022%2F6d423e3e-9858-436f-80c6-dcfa7bd7d497%2F3bdf1cc2-5ab6-4557-b0df-9d0399a48021.png&blockId=accfd3ca-4bfe-4752-99ac-9ce830af9b47'
    WHEN 'dreaming' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2F782801ca-3dcc-4751-8a08-4267aa829022%2F26e29323-72d8-4ac6-b0a9-882924b4c71e%2F%25EC%258B%259C%25EB%25A6%25AC%25EC%25A6%2588%25EC%25BB%25A4%25EB%25B2%2584.jpg&blockId=57f4b88b-af86-4cba-a862-8de1766b5e32'
    WHEN 'smartphone addict' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F84ad5aef-4b8a-41f2-9b45-3c8b12168343%2F%EA%B2%B0%EA%B3%BC.jpg&blockId=3981a656-dfa2-4e2d-b753-67e789aca774'
    WHEN 'steelman' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Fbab31478-77cd-4a9e-8b30-e63f52eb65ff%2F%EC%98%81%EC%9B%85%EA%B0%95%EC%B2%A0%EB%82%A8.jpg&blockId=4ef21bb1-7019-4e57-9eb4-7cc2cc034b78'
    WHEN 'why_club' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Fa348d74c-97a9-4833-9fbc-b3a1a2757b9c%2F%EB%8F%84%EB%8C%80%EC%B2%B4%EC%99%9C%EC%9D%B8%EA%B5%AC%EB%8B%A8.jpg&blockId=ecaefc64-6a21-4376-b7db-553ce1da77b2'
    WHEN 'butterfly_girl' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Fd04fca48-d0a8-4592-a589-ced9abd64c58%2F%EB%8C%80%ED%91%9C%EC%9D%B4%EB%AF%B8%EC%A7%80(%EC%84%B8%EB%A1%9C).png&blockId=c9162796-3494-4785-9290-4ca84e74d29b'
    WHEN 'Punk' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F6f3dd6e1-e074-4bf6-a7d5-d89c60c440b3%2F%EB%82%A0%EB%9D%BC%EB%A6%AC_%EC%BB%A4%EB%B2%84%ED%99%95%EC%A0%95.jpg&blockId=a87544d0-0bc0-416b-9213-7e800d6a3601'
    WHEN 'Cross the universe nine times.' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Fee98f902-3ec8-45b8-8bb8-96214a183cc7%2F%EC%9E%91%ED%92%88%EB%AA%A9%EB%A1%9D%EC%9D%B4%EB%AF%B8%EC%A7%80.jpg&blockId=137b05ee-b858-439e-9a4f-29c4c9cffb60'
    WHEN 'authority_of_the_operator' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F489993e2-3153-4f20-bf41-0a6c8a6a14c2%2F%EC%9A%B4%EC%98%81%EC%9E%90%EC%9D%98_%EA%B6%8C%ED%95%9C%EC%9C%BC%EB%A1%9C_2.jpg&blockId=04914471-e1b9-4c52-969f-8b9111b56e66'
    WHEN 'cat_ggeong' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F39f7e328-b85e-46d2-9681-97f3369272d7%2F%EC%BB%A4%EB%B2%84%EC%9D%B4%EB%AF%B8%EC%A7%80.jpg&blockId=7ab99bbb-53cb-4e36-bad7-14bd455fd3f3'
    WHEN 'Throughout the winter' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F734c375c-b104-4a1c-83aa-dabcd8bcec24%2F%EA%B2%A8%EC%9A%B0%EB%82%B4%EB%B0%B0%EB%84%88.jpg&blockId=da8cc353-c766-4fdf-9b7a-4d9a45514054'
    WHEN 'my_alien_dad' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F1bd96cd0-bcb9-4d46-a92c-677b1d33d9fd%2F%EB%8C%80%ED%91%9C%EC%9D%B4%EB%AF%B8%EC%A7%802.jpg&blockId=c54e5f8c-57f3-4948-b879-1a388742eee6'
    WHEN 'findingme' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Fb6ba4ff3-60bf-4d4b-9077-ebc57629cc94%2Fheadline_640x326_%EB%B3%B5%EC%82%AC.png&blockId=0d65effa-548e-4e4a-ae0d-413107126d17'
    WHEN 'Never Mind Darling' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=attachment%3A5b28ecfa-f876-4387-a0c7-7b06d9bfc7a1%3A%ED%85%8D%EB%AF%B8%ED%95%98%EC%9D%B4(Take_me_high).jpg&blockId=1b2c7a4b-c718-8178-a952-e4dabc8cc59c'
    WHEN 'namepen_toon' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F04063257-dd60-4862-acc4-ba79a6ac14e5%2F%EB%84%A4%EC%9E%84%ED%8E%9C.png&blockId=3a99234f-c091-478f-ae21-7ee9f85f4331'
    WHEN 'ex_wife' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F491d1183-172d-46fe-8278-70d9fb770939%2F%EC%A0%84%EC%B2%98%EC%99%80%EC%9D%98%EB%8F%99%EA%B1%B0.jpg&blockId=2de44253-3fb9-4a10-a34d-cc725d47a454'
    WHEN 'love_translrator' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F9716eabf-26cc-4e41-b23a-b653ea67101a%2F%EC%82%AC%EB%B2%88%EC%95%B12.png&blockId=61275516-4819-41e6-8000-98bb6bb337fb'
    WHEN 'Becoming_Bad' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F34ff912b-8ea3-424a-abee-fd13dd764db6%2F%ED%91%9C%EC%A7%80.jpg&blockId=01fd211d-37e6-4847-8761-ba1f3049ce21'
    WHEN 'dealingthedead' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Ffae11247-f47e-410c-a70e-2a6500e0a067%2FB%EC%BB%A4%EB%B2%84%EC%9D%B4%EB%AF%B8%EC%A7%80_%EC%88%98%EC%A0%95.jpg&blockId=9408ab82-f37e-47e9-870e-f3c931d5710d'
    WHEN 'shadowy beauty' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Fb87519ea-6199-44be-9ef0-2e8a58a127c8%2F%EA%B7%B8%EB%A6%BC%EC%9E%90_%EB%AF%B8%EB%85%80_%EB%8C%80%ED%91%9C%EC%9D%B4%EB%AF%B8%EC%A7%80.jpg&blockId=0e686c64-7802-473e-857c-8c9afa5e0ea5'
    WHEN 'human market' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F25c8e43d-ea41-43db-a3ac-29a8c2c79962%2F%EC%9D%B8%EA%B0%84%EC%8B%9C%EC%9E%A5_%EB%A9%94%EC%9D%B8%ED%8F%AC%EC%8A%A4%ED%84%B0.jpg&blockId=faa3a08e-7f5f-431f-b083-eae6c38ef2bd'
    WHEN 'https://data.oopy.io/ weangtoon5' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Fd1c25fd0-089f-4ff2-803f-86c9c12a11ce%2F%E1%84%83%E1%85%A2%E1%84%91%E1%85%AD%E1%84%8B%E1%85%B5%E1%84%86%E1%85%B5%E1%84%8C%E1%85%B5_%E1%84%80%E1%85%A1%E1%84%85%E1%85%A9%E1%84%92%E1%85%A7%E1%86%BC.png&blockId=9a7573ad-43b3-49d5-a39d-7c424a0986a0'
    WHEN 'chosun_SUPERidol' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F8cdcf73d-f19a-4693-8d9d-15c401d91a62%2F%EC%A1%B0%EC%84%A0%ED%8C%94%EB%8F%84%EB%B6%81%EC%8A%A4_%ED%91%9C%EC%A7%80.jpg&blockId=36c8f754-7697-462a-ab89-cd8566e9670a'
    WHEN 'love_hate_relationship' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F36da9d84-66dd-4138-9f19-62a0ca7148f0%2F%EC%95%A0%EC%A6%9D%EA%B3%BC_%EC%95%A0%EC%A0%95%EC%82%AC%EC%9D%B4_%EB%B0%B0%EB%84%88_%EC%B5%9C%EC%A2%85_%EC%A0%9C%EB%AA%A9%EC%97%86%EC%9D%8C.jpg&blockId=3186a3b3-30bc-4926-b525-f73782b458d8'
    WHEN 'melancholy' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F7bd6ef32-4408-4d15-83e8-52598619b7fc%2F%EB%A9%9C%EB%9E%91%EA%BC%B4%EB%A6%AC_%EB%B3%B5%EC%82%AC.jpg&blockId=05cb8cc4-c68d-416a-a466-a22e4ff65dd1'
    WHEN 'fate' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2F782801ca-3dcc-4751-8a08-4267aa829022%2Ff9fea801-b70e-436b-8f5a-9f1cb30c0ee3%2F%25ED%258E%2598%25EC%259D%25B4%25ED%258A%25B8.jpg&blockId=2e058d92-d60a-4f11-b759-b08e2bcc71a9'
    WHEN 'I''ll do everything for you' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F9a75a371-c05b-4f1e-b4e5-05651a785115%2F%EB%8B%A4%ED%95%B4%EC%A4%84%EA%B2%8C016_009.jpg&blockId=17f320e2-3996-46d6-9581-87a2177fe306'
    WHEN 'beauty_maker' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F41114c5c-70aa-4589-9418-9f67628db185%2F%EA%B6%8C%ED%98%B8%EC%84%A0_%EC%96%BC%EA%B5%B4%EB%AF%B8%ED%99%94%EB%B6%80.jpg&blockId=a9804d91-3fd3-4e3a-b235-39da6a10a07c'
    WHEN 'BIG_maknae' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F0be79179-dc8f-44e1-9ad6-7a88e12cd61f%2F%EB%8C%80%ED%98%95%EB%A7%89%EB%82%B4!_%EB%8C%80%ED%91%9C%EC%9D%B4%EB%AF%B8%EC%A7%80_%EC%B5%9C%EC%A2%85.jpg&blockId=b7a3dd2d-28f5-4611-8f71-dcf4772a231e'
    WHEN 'Change_me' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Fd509c97f-c220-43d5-9e8f-2658d5d46793%2F1_%EB%A9%94%EC%9D%B8_%EB%8C%80%EB%B0%B0%EB%84%88_%EB%B3%B5%EC%82%AC.jpg&blockId=d2c27977-3886-40d9-a0e3-d7e04c0fcb26'
    WHEN 'demoniac' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F991ff2d9-cff1-4f5c-a89d-d1f5024b45f1%2F%EC%9E%90%EB%A5%B4%EA%B8%B0%ED%95%9C%EA%B1%B0.jpg&blockId=32e871b7-a96e-4b4c-ba75-ec0c906f6d55'
    WHEN 'her_bucketlist' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2F782801ca-3dcc-4751-8a08-4267aa829022%2Fe6805fa7-641a-4766-807c-b71b136d2a15%2F%25EB%2584%25A4%25EC%259D%25B4%25EB%25B2%2584_%25EB%258C%2580%25ED%2591%259C%25EC%259D%25B4%25EB%25AF%25B8%25EC%25A7%2580.jpg&blockId=665e3d4e-9f09-4e6a-a81a-8a81ce5efe29'
    WHEN 'smart_family' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F9e89b4d0-ec7b-4e02-bc74-0a0b568606c8%2F%EC%8A%A4%EB%A7%88%ED%8A%B8%ED%8C%A8%EB%B0%80%EB%A6%AC_%EB%AA%A8%EB%B0%94%EC%9D%BC_%ED%97%A4%EB%93%9C%EB%9D%BC%EC%9D%B8.jpg&blockId=95f58b6a-aff3-4b0b-8dd3-e34619313499'
    WHEN 'witch_loveornot' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F6c4f6816-8575-4539-896b-733cdecf967c%2F%EB%A7%88%EC%82%AC%EA%B4%9C_%EB%8C%80%ED%91%9C%EC%9D%B4%EB%AF%B8%EC%A7%80%EC%88%98%EC%A0%95.jpg&blockId=8208ac84-39e6-4906-93c3-20a206ee327d'
    WHEN 'Luck 4 you' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Fd3e8bba3-a14c-47ff-8033-d040296307ad%2F%EC%8B%9C%EB%A6%AC%EC%A6%88%EC%BB%A4%EB%B2%84%EC%9D%B4%EB%AF%B8%EC%A7%80.jpg&blockId=7dab1e30-a517-4de7-b597-38b501b6a6e5'
    WHEN 'cryingrabbit' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2F782801ca-3dcc-4751-8a08-4267aa829022%2Fd9b1909c-f837-45d6-876e-8104b4d7488b%2F%25EC%25BB%25A4%25EB%25B2%2584%25EC%259D%25B4%25EB%25AF%25B8%25EC%25A7%2580.jpg&blockId=a9ef1616-3b59-4b5b-a8e8-a60bd8b73dab'
    WHEN 'the_trauma' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F363934bc-cd11-437a-81a4-2227850cecf2%2F%ED%8A%B8%EB%9D%BC%EC%9A%B0%EB%A7%88%ED%91%9C%EC%A7%802.jpg&blockId=7b262fc4-e64a-4e90-a420-87e355ac76e8'
    WHEN 'Never Mind Darling' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F8101a11c-a13c-4d0e-a706-1e71e88371e3%2F%EB%8C%80%ED%91%9C_%EC%9D%B4%EB%AF%B8%EC%A7%80_%EC%83%89%EA%B0%90%EB%B3%B4%EC%A0%95.jpg&blockId=34ad53d9-d856-401c-b3f9-9a1debb3769e'
    WHEN 'HOPErestaurant' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2F782801ca-3dcc-4751-8a08-4267aa829022%2Fd04fc557-cd4e-4f36-bb97-b665b5691831%2F%25E1%2584%2592%25E1%2585%25A6%25E1%2584%2583%25E1%2585%25B3%25E1%2584%2585%25E1%2585%25A1%25E1%2584%258B%25E1%2585%25B5%25E1%2586%25AB_%25E1%2584%2586%25E1%2585%25A9%25E1%2584%2587%25E1%2585%25A1%25E1%2584%258B%25E1%2585%25B5%25E1%2586%25AF.jpg&blockId=5319c99c-1575-4514-8180-933353b034a8'
    WHEN 'beneficial_pervert' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Ffa5a4775-a8fb-482c-a0b4-b847506534a1%2F%EC%9D%B4%EB%A1%9C%EC%9A%B4%EB%B3%80%ED%83%9C.jpg&blockId=46c563f5-43ac-449b-8995-73e6cb52c25d'
    WHEN 'sweatsuit' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F93e475c9-76de-47ac-857c-3c372c387c35%2F%EC%B8%84%EB%A6%AC%EB%8B%9D_%ED%91%9C%EC%A7%80_%EB%B3%B5%EC%82%AC.jpg&blockId=5b5ea5cc-9cb4-4e62-924c-fa2763d747ec'
    WHEN 'HOME5' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F754db706-9350-49af-9506-55b48874d613%2F%25ED%2599%2588%25ED%258C%258C%25EC%259D%25B4%25EB%25B8%258C_%25EC%258B%259C%25EC%25A6%258C2_%25EB%258C%2580%25ED%2591%259C%25EC%259D%25B4%25EB%25AF%25B8%25EC%25A7%2580.jpg&blockId=f4c8aa72-aae8-408a-afc8-d140d77bc4bd'
    WHEN 'spring and winter' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Fc844fb1e-e6da-4df0-920b-ad4ee8605a1e%2F%EB%8C%80%ED%91%9C%EC%9D%B4%EB%AF%B8%EC%A7%80_%EC%B5%9C%EC%A2%85.jpg&blockId=ed26c415-4f67-476b-96b2-62d476d5ae2b'
    WHEN 'cowarldy_physical' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Fb7b78054-ea04-4fdb-adba-232a24089aa2%2F%EA%B2%81%EC%9F%81%EC%9D%B4.jpg&blockId=2bd07ffd-babd-4f40-a0eb-256a56ad1ac0'
    WHEN 'wooengtoon_four' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F857b38ae-3765-4225-9800-e2d1e96697b7%2F%EB%91%98%EC%A7%B8_%EC%96%BC%EA%B5%B4.jpg&blockId=f1fa0faf-1e0b-4c00-9f5c-9e48dfcfb90f'
    WHEN 'we_are_everyday' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F8cecd719-5b0d-452e-ba11-207321103661%2F%EC%9A%B0%EB%A6%AC%EB%8A%94_%EB%A7%A4%EC%9D%BC%EB%A7%A4%EC%9D%BC.jpg&blockId=e0d4506d-a2f6-49b6-88b7-843f64e551c3'
    WHEN 'day_say_hey' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F768cd624-aa1f-40bc-bc62-1563d835c2fb%2F%EC%BB%A4%EB%B2%84%EC%9D%B4%EB%AF%B8%EC%A7%80.jpg&blockId=0c8206d4-7eb5-4de2-8d96-3fb52c961cec'
    WHEN 'dimly_dontforgetme' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F0af4c4b4-b6c8-44c7-8992-f97fd4fe7b54%2F%EC%95%84%EC%8A%A4%EB%9D%BC%EC%9D%B4_title_%EB%B3%B5%EC%82%AC.png&blockId=80f0f9f6-bd7d-4175-9c7d-50caf0b9b7e8'
    WHEN 'Luna' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F18805a19-817a-449c-8569-7a2d8bb82d3b%2F%EB%A3%A8%EB%82%98_%EC%9D%BC%EB%9F%AC%EC%8A%A4%ED%8A%B8_8.jpg&blockId=3d6a8b33-5fc2-4616-9449-1adf23ea5712'
    WHEN 'half_invisibleman' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Ff7640586-036f-4c38-93b3-b9d0b39dc600%2F%EB%B0%98%ED%88%AC%EB%AA%85%EB%B6%81%EC%8A%A4%ED%91%9C%EC%A7%80.jpg&blockId=ec45f39b-a759-48e1-be75-023b7a11f0b3'
    WHEN 'Who am I' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F728a912f-c2f7-47f8-bd06-4bc3cc4b86e6%2F%EB%82%B4%EA%B0%80_%EB%88%84%EA%B5%AC%EA%B0%9C_%EB%8C%80%ED%91%9C%EC%9D%B4%EB%AF%B8%EC%A7%80.jpg&blockId=93d7407c-d939-4c96-a61e-003cacbe06d7'
    WHEN 'Devil Number 4' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F08918a96-661f-4f8e-8a83-c9fd5cd931db%2F%EB%8C%80%ED%91%9C%EC%84%AC%EB%84%A4%EC%9D%BC.jpg&blockId=6576bb2d-d113-4ee7-8566-f8cf71bfea1d'
    WHEN 'stuffed_animals' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F3da26293-0902-40b0-913d-f8e8dda15221%2F%EB%8C%80%ED%91%9C%EC%9D%B4%EB%AF%B8%EC%A7%80_%EA%B0%80%EB%A1%9C%ED%98%95.jpg&blockId=fbb4ff95-5f20-4ee1-905c-c031430d4e1a'
    WHEN 'springblooming' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2F782801ca-3dcc-4751-8a08-4267aa829022%2F3e3662f3-97a8-461c-9f2a-956d899521a2%2F%25EA%25BD%2583%25EC%2597%2590_app_headline.jpg&blockId=4902abd8-630d-4e73-b786-fe7299bdfd0c'
    WHEN 'handmaker_thegold' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F8dcad99e-16af-4d3b-8c43-901b31e7866c%2F%ED%99%A9%EA%B8%88%EC%9D%98%ED%95%B8%EB%93%9C%EB%A9%94%EC%9D%B4%EC%BB%A4_%EB%84%A4%EC%9D%B4%EB%B2%84%EB%B6%81%EC%8A%A4%ED%91%9C%EC%A7%80_1.jpg&blockId=39786f9a-a714-4fed-96f2-58aef624d497'
    WHEN 'story_someone_i_know' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Fd9be768e-196a-4de9-86ff-a612a4ca6f4f%2F%EC%95%84%EC%82%AC%EC%9D%B4_%EB%91%90%EB%B2%88%EC%A7%B8_%EB%B0%B0%EB%84%88.jpg&blockId=c8ca8102-20c7-4898-8f50-ac27e9a642c5'
    WHEN 'comedyclass' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Ff455c07a-4eb1-421e-8326-c4a6cd9bd262%2F%EC%8D%B8%EB%84%A4%EC%9D%BC_%ED%9B%84%EB%B3%B41.png&blockId=7e66b3d9-826c-46af-aa85-089ef85a812b'
    WHEN 'Great materpiece' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F640d0fe0-6fd1-4ae9-86fd-da7bde95f8b3%2F%EC%BB%A4%EB%B2%84%EC%9D%B4%EB%AF%B8%EC%A7%80(%EB%8F%84%EB%AC%B8%EB%8C%80%EC%9E%91).jpg&blockId=60fef466-d7e0-43a7-b964-75e1da8b1132'
    WHEN 'love&wish' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F822f6090-9db6-44f8-a36d-ffa754751f30%2F%EB%9F%AC%EB%B8%8C%EC%95%A4%EC%9C%84%EC%8B%9C.jpg&blockId=080682ce-6b51-4e8f-94ec-b7a52c91fb0d'
    WHEN 'Dead Life' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F125889cb-5f8b-44ea-abb9-fb1efd885f0c%2FUntitled.png&blockId=aa2f39e4-76ca-4585-a02e-28c6357aef8e'
    WHEN 'end_and_start' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F98848ce6-27de-49c9-bbab-39d0465f190c%2F%EC%8D%B8%EB%84%A4%EC%9D%BC.png&blockId=e91fa4f7-ba64-4fd7-82cf-5f355dea308f'
    WHEN 'love_boutique' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Ff5017bf0-59ff-4071-a727-59ad06e5770b%2F%EC%82%AC%EB%9E%91%EC%96%91%EC%9E%A5%EC%A0%90_%ED%99%8D%EB%B3%B4%EC%9A%A9%EC%9D%B4%EB%AF%B8%EC%A7%802.png&blockId=144675c7-2ee4-41f0-885e-237bfc5cdef1'
    WHEN 'pumpkintime' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2F782801ca-3dcc-4751-8a08-4267aa829022%2F2af2ab79-9b6b-4728-a153-f101d64fe9d2%2F%25EB%258C%2580%25ED%2591%259C%25EC%259D%25B4%25EB%25AF%25B8%25EC%25A7%2580_%25EA%25B0%2580%25EB%25A1%259C.jpg&blockId=a48070ab-635f-4bfa-b2d3-d9d2cab6149d'
    WHEN 'Guess who my future husband is.' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F2bbc7188-4841-442d-b841-c9871d8298b6%2F%EB%8C%80%ED%91%9C%EC%9D%B4%EB%AF%B8%EC%A7%80_(1).jpg&blockId=15c1bfc4-d58e-4937-9862-fa3bdc52c3c6'
    WHEN 'NPC' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F8d28a966-1bdc-4f46-9720-81a316815682%2Fnpc.jpg&blockId=6b408e9c-1519-47bd-b345-554e4c9f30d9'
    WHEN 'unmoodsella' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Ff548ea23-7cd8-4311-93b1-8eb028bf97e2%2F%EC%96%B8%EB%AC%B4%EB%93%9C%EC%85%80%EB%9D%BC-%EC%8D%B8%EB%84%A4%EC%9D%BC-%EC%B5%9C%EC%A2%85.jpg&blockId=e02a3310-bceb-426d-9bd2-1fc002835664'
    WHEN 'mayago' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Fd8fe64bf-6de1-4f67-93b3-d81bc54314ea%2F%EB%A1%9C%EA%B3%A0%EB%8B%A4.jpg&blockId=d546a5c0-b0df-442e-b43d-7d6537d1a0d7'
    WHEN 'crack' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F7ebceb92-b0cb-43ae-a5c4-db9988912953%2F02%EC%98%86%EC%A7%91%EC%97%AC%EC%9E%90_%EC%A3%BC%EC%9D%B8%EA%B3%B5.png&blockId=7145f43f-a37b-4fac-a930-5fbf72c14283'
    WHEN 'Watch out for your boyfriend' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F6a7fde85-b50e-47a1-9dab-4fa567e00c66%2F%EB%8C%80%ED%91%9C%EC%9D%B4%EB%AF%B8%EC%A7%80_%EC%84%B8%EB%A1%9C.jpg&blockId=7cc33ac7-67bb-457d-911e-17b8434b9ba4'
    WHEN 'luckygohappy' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F843ad7dd-9b89-4be6-a248-7d141bd75ba8%2F%EB%9F%AD%ED%82%A4%EA%B3%A0%ED%95%B4%ED%94%BC_(1).jpg&blockId=9e03cf00-b89a-4826-9c38-98842e2b037b'
    WHEN 'But I still love you' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Fd454b12f-d015-42f4-82b4-4166fbb18c8c%2F%EA%B7%B8%EB%9E%98%EB%8F%84%EC%82%AC%EB%9E%91%ED%95%B4.jpg&blockId=3a183c8d-4825-4d55-a0a3-310ace7a3614'
    WHEN 'share house' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Feb2b626b-d9e1-4f3a-b980-e8ae59dd9b38%2F%EA%B3%B5%EC%9C%A0%ED%95%98%EB%8A%94_%EC%A7%91_%EB%B0%B0%EB%84%88.jpg&blockId=2cf468ab-25c8-4dde-8825-f00d498275e1'
    WHEN 'Never Mind Darling' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2F782801ca-3dcc-4751-8a08-4267aa829022%2F9b7ae83b-d3e6-48a8-abff-7c439df72a81%2F2.jpg&blockId=f0d8ca0b-1fbe-4469-9404-05923ea41720'
    WHEN 'Idol House' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F002c999d-3725-4af0-ad64-68330b814c4c%2F02.jpg&blockId=93e597a1-a953-42cd-bbc2-bcb60d633d3e'
    WHEN 'red' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F48dd014c-dc2e-4a45-8986-cfee93547587%2F%EB%8C%80%ED%91%9C%EC%9D%B4%EB%AF%B8%EC%A7%80.jpg&blockId=3b10d252-cb3c-448a-81d7-bb0e0387e8d6'
    WHEN 'cocostew' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F2b78c509-4593-49fb-8333-df8f64669350%2F%EC%BD%94%EC%BD%94%EC%8A%A4%ED%8A%9C.jpeg&blockId=7908aa65-392b-4737-9f95-16481b85b9cf'
    WHEN 'the_possession' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F1365c0ab-08f6-4094-bc1a-523b05a0d4a1%2F25%ED%99%94-%ED%83%80%EC%9D%B4%ED%8B%80.jpg&blockId=a0ef1c05-f439-4a20-9cce-425c3c897be1'
    WHEN 'Like You''ve Never Been Hurt' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F16a0a932-8a5e-4c58-a9c6-4b54a8b8a5de%2F%EC%9D%BC%EB%9F%AC%EC%8A%A4%ED%8A%B8_%EC%82%AC%EC%9D%B4%EC%A6%88%EC%A1%B0%EC%A0%88%EB%B3%B82.png&blockId=6504e624-2938-4ece-9064-33321a1dc8ac'
    WHEN 'love_is_big' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Fba6222b1-c870-4c32-9bdc-e193de59c1e1%2F%EC%82%AC%EB%9E%91%EC%9D%B4%EC%BB%A4%EB%8B%A4%EB%9E%98%EB%B0%B0%EB%84%88.png&blockId=bbae1400-c5f3-41d1-a874-99f135ba52d4'
    WHEN 'the_extreme' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Febaf31dd-9893-4196-b873-0a86f4a44041%2F%EC%84%B8%EB%A1%9C_%EB%B0%B0%EB%84%88.jpg&blockId=ed128a68-fcca-4936-8fc4-ef7a99a73b7f'
    WHEN 'iampet_4' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Faa30cf9f-6050-4d55-9447-293df8dd6b58%2F%EC%95%84%EC%9E%84%ED%8E%AB4%EB%B0%B0%EB%84%88_%EB%B3%B5%EC%82%AC.png&blockId=2c0b3e02-42dc-4c4b-b215-e8301743404b'
    WHEN 'neighbor_taste' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Ffe7b6dc5-89f1-4345-b278-24b7fcadad70%2F%EB%8C%80%ED%91%9C%EC%9D%B4%EB%AF%B8%EC%A7%80_%EC%84%B8%EB%A1%9C%ED%98%95.jpg&blockId=c97b69e6-e70c-4526-82ec-c6cc0ef285e5'
    WHEN 'A good relationship' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F67a64e30-89ef-4090-ba6b-c66b4883e5b4%2F%25EC%2597%25BC%25EB%259D%25BC%25EC%259D%2598_%25EC%2588%25A8%25EA%25B2%25B0_%25EB%258C%2580%25ED%2591%259C%25EC%259D%25B4%25EB%25AF%25B8%25EC%25A7%2580.jpg&blockId=12ae327f-6fae-458f-92ee-25b60d7c30ef'
    WHEN 'will_you_marry_me' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F5a129377-8973-4bb9-aa72-253a0326a034%2F034-%EC%9C%8C%EC%9C%A0%EB%A9%94%EB%A6%AC01.png&blockId=a7e7dcef-8ffc-4bb6-b7d9-03236d8a39c8'
    WHEN 'is love delicious fried as well?' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F064d0237-3eb6-4b0d-9ac9-5ad7e05b6aec%2F%EB%8C%80%ED%91%9C%EC%9D%B4%EB%AF%B8%EC%A7%80_%EC%B9%B4%EC%B9%B4%EC%98%A4%ED%8E%98%EC%9D%B4%EC%A7%80.jpg&blockId=68eca8ae-8266-4774-9a42-934c8f3c27f1'
    WHEN 'The owner is two-time.' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Fea023157-9842-4879-bf7d-b6fd3e48d47a%2F%EB%8C%80%ED%91%9C%EC%9D%B4%EB%AF%B8%EC%A7%80.jpg&blockId=b86ddca7-9911-4467-bc0a-528325920beb'
    WHEN 'hang byun sin' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Fea958da8-5e25-4ca1-a0c0-d8b09a138feb%2F%EB%8C%80%ED%91%9C_%EC%9D%B4%EB%AF%B8%EC%A7%80.jpg&blockId=2697d679-1b1c-4cdb-a746-4975ba8048e0'
    WHEN 'ddasick' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F6582cd46-111d-46f1-af58-5190fcc5dd91%2FB.png&blockId=ecfaffbb-6e15-4a1e-945b-22bc6eb05640'
    WHEN 'noise' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F8692ba23-94a1-443e-b164-8cbb32f8f318%2F%EC%86%8C%EC%9D%8C%EC%8B%9C%EB%A6%AC%EC%A6%88.jpg&blockId=19b5eb8f-4afd-46f4-a006-28e2b3e3a6f3'
    WHEN 'moosick' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F7aaa1010-f1f3-4fcb-a71c-a8e7e7dcd1e8%2F005-1_%EB%B3%B5%EC%82%AC.png&blockId=1c0453f2-5066-4fb2-9efd-c0d6caa15aef'
    WHEN 'serendipity' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Ff0411885-e2d8-4b4e-8f6e-543406835ca6%2F14401000%EB%B0%B0%EB%84%88.jpg&blockId=61630920-51c6-4dd1-aa18-24867fe4d110'
    WHEN 'bowing_puppy' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F40b3c169-f4d3-4b6b-8a28-92bbd201a7ef%2F%EC%A0%88%EA%B0%95-%EC%BB%A4%EB%B2%84%EC%9D%B4%EB%AF%B8%EC%A7%80-new.png&blockId=0e494ddc-841e-4db9-bbf9-338f0dfef32e'
    WHEN 'evergreen' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Fc1a107d2-24ae-4878-9eb4-5c4ba121f30f%2F%EB%B0%B0%EB%84%88.jpg&blockId=7f20633a-6c6c-4566-8b58-7b95dc3c9868'
    WHEN 'gyoun-woo and Seon-nyeo.' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F33c2c7d0-bf69-4f0f-b7e3-8163bf5f51a4%2F%EB%B0%B0%EB%84%88-1500x1000.jpg&blockId=ed939bcf-dbc6-473b-b248-6e6a757f3b5b'
    WHEN 'Sweet salty' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Fc62d06e0-b1e6-4f7e-a17d-ec8893b86a2c%2F%EC%8B%9C%EB%A6%AC%EC%A6%88-%EA%B6%8C%ED%98%B8%EC%8D%B8%EB%84%A4%EC%9D%BC.jpg&blockId=c50b255d-1a6e-427f-aa45-cb91be6438d7'
    WHEN 'the_sichitkingdom' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Fcadf4977-8a83-4404-84fc-00fc1319ef4d%2F%EC%8D%B8%EB%84%A4%EC%9D%BC.jpg&blockId=ed7f1398-cf21-4943-ad99-c0531335ca00'
    WHEN 'magician' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F1952f048-c5d9-4fe0-8d52-fe66d2224b19%2F%EC%8D%B8%EB%84%A4%EC%9D%BC.jpeg&blockId=60ce66ee-4f6d-4f0a-a5ed-d3cbedcb7d74'
    WHEN 'owner_and_me' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F352b867f-da84-4ea4-a89e-effe805dfa7d%2F%EC%A7%80%EA%B5%AC%EC%9D%98%EC%A3%BC%EC%9D%B8%EA%B3%BC_%EB%AF%B8%EB%A6%AC%EB%B3%B4%EA%B8%B0.jpg&blockId=851de747-6a94-4c16-b89c-7887ae2ec0b7'
    WHEN 'NASSA' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F923982d9-05df-4659-8f72-4b31650e512e%2F%EB%82%98%EC%8B%B8.png&blockId=e0be5e4e-1750-47a1-959f-4303a074d58d'
    WHEN 'Ideal Us' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Fda35bd28-bda8-47e7-b484-04c395302f4c%2F%EC%9D%BC%EB%9F%AC%EC%8A%A4%ED%8A%B8.jpg&blockId=51602440-e9cd-4c4f-9e43-a0d108050c18'
    WHEN 'removing' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F113a8c03-55a3-4016-9247-699fa60f7a41%2F%EB%B9%84%EC%84%B1%EC%9D%B8_%ED%8F%AC%EC%8A%A4%ED%84%B0.jpg&blockId=cdf9a36e-37b8-4fcb-beb4-35d647b54ae0'
    WHEN 'Alone_on_the_island' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F7367f965-5456-4d8a-8b6c-903940f2a8d2%2F%EB%82%98%ED%99%80%EB%A1%9C.jpg&blockId=ed10c85b-9a0c-47fe-85b5-fd303d59057d'
    WHEN 'dangerous_cohabitation' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2F782801ca-3dcc-4751-8a08-4267aa829022%2F0c2c9577-5dc0-42f3-8194-58d8dc36b3dd%2F%25EC%25BB%25A4%25EB%25B2%2584_%25EC%259D%25B4%25EB%25AF%25B8%25EC%25A7%2580.jpg&blockId=72b60758-f73e-4cdb-8d71-b1052860682a'
    WHEN '2D Comedy' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Fcaa470b7-7129-4f50-97c0-5c9a4780b007%2FUntitled.png&blockId=b8d6bf2b-2027-4691-a5ad-75fe1ca744e7'
    WHEN 'hello_doggaebi' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F02d6f563-32fa-4561-9bb0-21798995efe1%2F%EC%95%88%EB%85%95%EB%8F%84%EA%B9%A8%EB%B9%84_%EB%AA%A8%EB%B0%94%EC%9D%BC_%ED%97%A4%EB%93%9C%EB%9D%BC%EC%9D%B8.jpg&blockId=4dfcc314-7c22-4661-9e4b-7f169fce771d'
    WHEN 'boogie_movie' THEN 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Fc6841d27-82fa-4eae-91ca-d0d17660bb3b%2F%EB%8C%80%ED%91%9C%EC%9D%B4%EB%AF%B8%EC%A7%80_%EA%B0%80%EB%A1%9C.jpg&blockId=f550d02d-ef37-442c-8b94-0ad0dcb2e83e'
    ELSE title_image -- Keep existing image if no match
END
WHERE title_name_en IN (
    'Crush on You',
    'ex_girlfriend',
    'dreaming',
    'smartphone addict',
    'steelman',
    'why_club',
    'butterfly_girl',
    'Punk',
    'Cross the universe nine times.',
    'authority_of_the_operator',
    'cat_ggeong',
    'Throughout the winter',
    'my_alien_dad',
    'findingme',
    'Never Mind Darling',
    'namepen_toon',
    'ex_wife',
    'love_translrator',
    'Becoming_Bad',
    'dealingthedead',
    'shadowy beauty',
    'human market',
    'https://data.oopy.io/ weangtoon5',
    'chosun_SUPERidol',
    'love_hate_relationship',
    'melancholy',
    'fate',
    'I''ll do everything for you',
    'beauty_maker',
    'BIG_maknae',
    'Change_me',
    'demoniac',
    'her_bucketlist',
    'smart_family',
    'witch_loveornot',
    'Luck 4 you',
    'cryingrabbit',
    'the_trauma',
    'Never Mind Darling',
    'HOPErestaurant',
    'beneficial_pervert',
    'sweatsuit',
    'HOME5',
    'spring and winter',
    'cowarldy_physical',
    'wooengtoon_four',
    'we_are_everyday',
    'day_say_hey',
    'dimly_dontforgetme',
    'Luna',
    'half_invisibleman',
    'Who am I',
    'Devil Number 4',
    'stuffed_animals',
    'springblooming',
    'handmaker_thegold',
    'story_someone_i_know',
    'comedyclass',
    'Great materpiece',
    'love&wish',
    'Dead Life',
    'end_and_start',
    'love_boutique',
    'pumpkintime',
    'Guess who my future husband is.',
    'NPC',
    'unmoodsella',
    'mayago',
    'crack',
    'Watch out for your boyfriend',
    'luckygohappy',
    'But I still love you',
    'share house',
    'Never Mind Darling',
    'Idol House',
    'red',
    'cocostew',
    'the_possession',
    'Like You''ve Never Been Hurt',
    'love_is_big',
    'the_extreme',
    'iampet_4',
    'neighbor_taste',
    'A good relationship',
    'will_you_marry_me',
    'is love delicious fried as well?',
    'The owner is two-time.',
    'hang byun sin',
    'ddasick',
    'noise',
    'moosick',
    'serendipity',
    'bowing_puppy',
    'evergreen',
    'gyoun-woo and Seon-nyeo.',
    'Sweet salty',
    'the_sichitkingdom',
    'magician',
    'owner_and_me',
    'NASSA',
    'Ideal Us',
    'removing',
    'Alone_on_the_island',
    'dangerous_cohabitation',
    '2D Comedy',
    'hello_doggaebi',
    'boogie_movie'
);

-- Method 2: Individual UPDATE statements (for selective updates)
/*
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Fe7fb3fbd-0da9-4f4b-ad21-1e993a85fd77%2F%EC%9E%AC%EB%B0%8C%EB%8B%88%EC%A7%9D%EC%82%AC%EB%9E%91_%EB%A9%94%EC%9D%B8%EB%B0%B0%EB%84%882(720x972).jpg&blockId=26d94fee-bc6c-40ca-bfce-893212ff8a87' WHERE title_name_en = 'Crush on You';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2F782801ca-3dcc-4751-8a08-4267aa829022%2F6d423e3e-9858-436f-80c6-dcfa7bd7d497%2F3bdf1cc2-5ab6-4557-b0df-9d0399a48021.png&blockId=accfd3ca-4bfe-4752-99ac-9ce830af9b47' WHERE title_name_en = 'ex_girlfriend';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2F782801ca-3dcc-4751-8a08-4267aa829022%2F26e29323-72d8-4ac6-b0a9-882924b4c71e%2F%25EC%258B%259C%25EB%25A6%25AC%25EC%25A6%2588%25EC%25BB%25A4%25EB%25B2%2584.jpg&blockId=57f4b88b-af86-4cba-a862-8de1766b5e32' WHERE title_name_en = 'dreaming';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F84ad5aef-4b8a-41f2-9b45-3c8b12168343%2F%EA%B2%B0%EA%B3%BC.jpg&blockId=3981a656-dfa2-4e2d-b753-67e789aca774' WHERE title_name_en = 'smartphone addict';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Fbab31478-77cd-4a9e-8b30-e63f52eb65ff%2F%EC%98%81%EC%9B%85%EA%B0%95%EC%B2%A0%EB%82%A8.jpg&blockId=4ef21bb1-7019-4e57-9eb4-7cc2cc034b78' WHERE title_name_en = 'steelman';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Fa348d74c-97a9-4833-9fbc-b3a1a2757b9c%2F%EB%8F%84%EB%8C%80%EC%B2%B4%EC%99%9C%EC%9D%B8%EA%B5%AC%EB%8B%A8.jpg&blockId=ecaefc64-6a21-4376-b7db-553ce1da77b2' WHERE title_name_en = 'why_club';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Fd04fca48-d0a8-4592-a589-ced9abd64c58%2F%EB%8C%80%ED%91%9C%EC%9D%B4%EB%AF%B8%EC%A7%80(%EC%84%B8%EB%A1%9C).png&blockId=c9162796-3494-4785-9290-4ca84e74d29b' WHERE title_name_en = 'butterfly_girl';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F6f3dd6e1-e074-4bf6-a7d5-d89c60c440b3%2F%EB%82%A0%EB%9D%BC%EB%A6%AC_%EC%BB%A4%EB%B2%84%ED%99%95%EC%A0%95.jpg&blockId=a87544d0-0bc0-416b-9213-7e800d6a3601' WHERE title_name_en = 'Punk';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Fee98f902-3ec8-45b8-8bb8-96214a183cc7%2F%EC%9E%91%ED%92%88%EB%AA%A9%EB%A1%9D%EC%9D%B4%EB%AF%B8%EC%A7%80.jpg&blockId=137b05ee-b858-439e-9a4f-29c4c9cffb60' WHERE title_name_en = 'Cross the universe nine times.';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F489993e2-3153-4f20-bf41-0a6c8a6a14c2%2F%EC%9A%B4%EC%98%81%EC%9E%90%EC%9D%98_%EA%B6%8C%ED%95%9C%EC%9C%BC%EB%A1%9C_2.jpg&blockId=04914471-e1b9-4c52-969f-8b9111b56e66' WHERE title_name_en = 'authority_of_the_operator';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F39f7e328-b85e-46d2-9681-97f3369272d7%2F%EC%BB%A4%EB%B2%84%EC%9D%B4%EB%AF%B8%EC%A7%80.jpg&blockId=7ab99bbb-53cb-4e36-bad7-14bd455fd3f3' WHERE title_name_en = 'cat_ggeong';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F734c375c-b104-4a1c-83aa-dabcd8bcec24%2F%EA%B2%A8%EC%9A%B0%EB%82%B4%EB%B0%B0%EB%84%88.jpg&blockId=da8cc353-c766-4fdf-9b7a-4d9a45514054' WHERE title_name_en = 'Throughout the winter';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F1bd96cd0-bcb9-4d46-a92c-677b1d33d9fd%2F%EB%8C%80%ED%91%9C%EC%9D%B4%EB%AF%B8%EC%A7%802.jpg&blockId=c54e5f8c-57f3-4948-b879-1a388742eee6' WHERE title_name_en = 'my_alien_dad';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Fb6ba4ff3-60bf-4d4b-9077-ebc57629cc94%2Fheadline_640x326_%EB%B3%B5%EC%82%AC.png&blockId=0d65effa-548e-4e4a-ae0d-413107126d17' WHERE title_name_en = 'findingme';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=attachment%3A5b28ecfa-f876-4387-a0c7-7b06d9bfc7a1%3A%ED%85%8D%EB%AF%B8%ED%95%98%EC%9D%B4(Take_me_high).jpg&blockId=1b2c7a4b-c718-8178-a952-e4dabc8cc59c' WHERE title_name_en = 'Never Mind Darling';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F04063257-dd60-4862-acc4-ba79a6ac14e5%2F%EB%84%A4%EC%9E%84%ED%8E%9C.png&blockId=3a99234f-c091-478f-ae21-7ee9f85f4331' WHERE title_name_en = 'namepen_toon';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F491d1183-172d-46fe-8278-70d9fb770939%2F%EC%A0%84%EC%B2%98%EC%99%80%EC%9D%98%EB%8F%99%EA%B1%B0.jpg&blockId=2de44253-3fb9-4a10-a34d-cc725d47a454' WHERE title_name_en = 'ex_wife';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F9716eabf-26cc-4e41-b23a-b653ea67101a%2F%EC%82%AC%EB%B2%88%EC%95%B12.png&blockId=61275516-4819-41e6-8000-98bb6bb337fb' WHERE title_name_en = 'love_translrator';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F34ff912b-8ea3-424a-abee-fd13dd764db6%2F%ED%91%9C%EC%A7%80.jpg&blockId=01fd211d-37e6-4847-8761-ba1f3049ce21' WHERE title_name_en = 'Becoming_Bad';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Ffae11247-f47e-410c-a70e-2a6500e0a067%2FB%EC%BB%A4%EB%B2%84%EC%9D%B4%EB%AF%B8%EC%A7%80_%EC%88%98%EC%A0%95.jpg&blockId=9408ab82-f37e-47e9-870e-f3c931d5710d' WHERE title_name_en = 'dealingthedead';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Fb87519ea-6199-44be-9ef0-2e8a58a127c8%2F%EA%B7%B8%EB%A6%BC%EC%9E%90_%EB%AF%B8%EB%85%80_%EB%8C%80%ED%91%9C%EC%9D%B4%EB%AF%B8%EC%A7%80.jpg&blockId=0e686c64-7802-473e-857c-8c9afa5e0ea5' WHERE title_name_en = 'shadowy beauty';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F25c8e43d-ea41-43db-a3ac-29a8c2c79962%2F%EC%9D%B8%EA%B0%84%EC%8B%9C%EC%9E%A5_%EB%A9%94%EC%9D%B8%ED%8F%AC%EC%8A%A4%ED%84%B0.jpg&blockId=faa3a08e-7f5f-431f-b083-eae6c38ef2bd' WHERE title_name_en = 'human market';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Fd1c25fd0-089f-4ff2-803f-86c9c12a11ce%2F%E1%84%83%E1%85%A2%E1%84%91%E1%85%AD%E1%84%8B%E1%85%B5%E1%84%86%E1%85%B5%E1%84%8C%E1%85%B5_%E1%84%80%E1%85%A1%E1%84%85%E1%85%A9%E1%84%92%E1%85%A7%E1%86%BC.png&blockId=9a7573ad-43b3-49d5-a39d-7c424a0986a0' WHERE title_name_en = 'https://data.oopy.io/ weangtoon5';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F8cdcf73d-f19a-4693-8d9d-15c401d91a62%2F%EC%A1%B0%EC%84%A0%ED%8C%94%EB%8F%84%EB%B6%81%EC%8A%A4_%ED%91%9C%EC%A7%80.jpg&blockId=36c8f754-7697-462a-ab89-cd8566e9670a' WHERE title_name_en = 'chosun_SUPERidol';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F36da9d84-66dd-4138-9f19-62a0ca7148f0%2F%EC%95%A0%EC%A6%9D%EA%B3%BC_%EC%95%A0%EC%A0%95%EC%82%AC%EC%9D%B4_%EB%B0%B0%EB%84%88_%EC%B5%9C%EC%A2%85_%EC%A0%9C%EB%AA%A9%EC%97%86%EC%9D%8C.jpg&blockId=3186a3b3-30bc-4926-b525-f73782b458d8' WHERE title_name_en = 'love_hate_relationship';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F7bd6ef32-4408-4d15-83e8-52598619b7fc%2F%EB%A9%9C%EB%9E%91%EA%BC%B4%EB%A6%AC_%EB%B3%B5%EC%82%AC.jpg&blockId=05cb8cc4-c68d-416a-a466-a22e4ff65dd1' WHERE title_name_en = 'melancholy';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2F782801ca-3dcc-4751-8a08-4267aa829022%2Ff9fea801-b70e-436b-8f5a-9f1cb30c0ee3%2F%25ED%258E%2598%25EC%259D%25B4%25ED%258A%25B8.jpg&blockId=2e058d92-d60a-4f11-b759-b08e2bcc71a9' WHERE title_name_en = 'fate';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F9a75a371-c05b-4f1e-b4e5-05651a785115%2F%EB%8B%A4%ED%95%B4%EC%A4%84%EA%B2%8C016_009.jpg&blockId=17f320e2-3996-46d6-9581-87a2177fe306' WHERE title_name_en = 'I''ll do everything for you';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F41114c5c-70aa-4589-9418-9f67628db185%2F%EA%B6%8C%ED%98%B8%EC%84%A0_%EC%96%BC%EA%B5%B4%EB%AF%B8%ED%99%94%EB%B6%80.jpg&blockId=a9804d91-3fd3-4e3a-b235-39da6a10a07c' WHERE title_name_en = 'beauty_maker';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F0be79179-dc8f-44e1-9ad6-7a88e12cd61f%2F%EB%8C%80%ED%98%95%EB%A7%89%EB%82%B4!_%EB%8C%80%ED%91%9C%EC%9D%B4%EB%AF%B8%EC%A7%80_%EC%B5%9C%EC%A2%85.jpg&blockId=b7a3dd2d-28f5-4611-8f71-dcf4772a231e' WHERE title_name_en = 'BIG_maknae';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Fd509c97f-c220-43d5-9e8f-2658d5d46793%2F1_%EB%A9%94%EC%9D%B8_%EB%8C%80%EB%B0%B0%EB%84%88_%EB%B3%B5%EC%82%AC.jpg&blockId=d2c27977-3886-40d9-a0e3-d7e04c0fcb26' WHERE title_name_en = 'Change_me';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F991ff2d9-cff1-4f5c-a89d-d1f5024b45f1%2F%EC%9E%90%EB%A5%B4%EA%B8%B0%ED%95%9C%EA%B1%B0.jpg&blockId=32e871b7-a96e-4b4c-ba75-ec0c906f6d55' WHERE title_name_en = 'demoniac';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2F782801ca-3dcc-4751-8a08-4267aa829022%2Fe6805fa7-641a-4766-807c-b71b136d2a15%2F%25EB%2584%25A4%25EC%259D%25B4%25EB%25B2%2584_%25EB%258C%2580%25ED%2591%259C%25EC%259D%25B4%25EB%25AF%25B8%25EC%25A7%2580.jpg&blockId=665e3d4e-9f09-4e6a-a81a-8a81ce5efe29' WHERE title_name_en = 'her_bucketlist';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F9e89b4d0-ec7b-4e02-bc74-0a0b568606c8%2F%EC%8A%A4%EB%A7%88%ED%8A%B8%ED%8C%A8%EB%B0%80%EB%A6%AC_%EB%AA%A8%EB%B0%94%EC%9D%BC_%ED%97%A4%EB%93%9C%EB%9D%BC%EC%9D%B8.jpg&blockId=95f58b6a-aff3-4b0b-8dd3-e34619313499' WHERE title_name_en = 'smart_family';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F6c4f6816-8575-4539-896b-733cdecf967c%2F%EB%A7%88%EC%82%AC%EA%B4%9C_%EB%8C%80%ED%91%9C%EC%9D%B4%EB%AF%B8%EC%A7%80%EC%88%98%EC%A0%95.jpg&blockId=8208ac84-39e6-4906-93c3-20a206ee327d' WHERE title_name_en = 'witch_loveornot';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Fd3e8bba3-a14c-47ff-8033-d040296307ad%2F%EC%8B%9C%EB%A6%AC%EC%A6%88%EC%BB%A4%EB%B2%84%EC%9D%B4%EB%AF%B8%EC%A7%80.jpg&blockId=7dab1e30-a517-4de7-b597-38b501b6a6e5' WHERE title_name_en = 'Luck 4 you';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2F782801ca-3dcc-4751-8a08-4267aa829022%2Fd9b1909c-f837-45d6-876e-8104b4d7488b%2F%25EC%25BB%25A4%25EB%25B2%2584%25EC%259D%25B4%25EB%25AF%25B8%25EC%25A7%2580.jpg&blockId=a9ef1616-3b59-4b5b-a8e8-a60bd8b73dab' WHERE title_name_en = 'cryingrabbit';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F363934bc-cd11-437a-81a4-2227850cecf2%2F%ED%8A%B8%EB%9D%BC%EC%9A%B0%EB%A7%88%ED%91%9C%EC%A7%802.jpg&blockId=7b262fc4-e64a-4e90-a420-87e355ac76e8' WHERE title_name_en = 'the_trauma';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F8101a11c-a13c-4d0e-a706-1e71e88371e3%2F%EB%8C%80%ED%91%9C_%EC%9D%B4%EB%AF%B8%EC%A7%80_%EC%83%89%EA%B0%90%EB%B3%B4%EC%A0%95.jpg&blockId=34ad53d9-d856-401c-b3f9-9a1debb3769e' WHERE title_name_en = 'Never Mind Darling';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2F782801ca-3dcc-4751-8a08-4267aa829022%2Fd04fc557-cd4e-4f36-bb97-b665b5691831%2F%25E1%2584%2592%25E1%2585%25A6%25E1%2584%2583%25E1%2585%25B3%25E1%2584%2585%25E1%2585%25A1%25E1%2584%258B%25E1%2585%25B5%25E1%2586%25AB_%25E1%2584%2586%25E1%2585%25A9%25E1%2584%2587%25E1%2585%25A1%25E1%2584%258B%25E1%2585%25B5%25E1%2586%25AF.jpg&blockId=5319c99c-1575-4514-8180-933353b034a8' WHERE title_name_en = 'HOPErestaurant';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Ffa5a4775-a8fb-482c-a0b4-b847506534a1%2F%EC%9D%B4%EB%A1%9C%EC%9A%B4%EB%B3%80%ED%83%9C.jpg&blockId=46c563f5-43ac-449b-8995-73e6cb52c25d' WHERE title_name_en = 'beneficial_pervert';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F93e475c9-76de-47ac-857c-3c372c387c35%2F%EC%B8%84%EB%A6%AC%EB%8B%9D_%ED%91%9C%EC%A7%80_%EB%B3%B5%EC%82%AC.jpg&blockId=5b5ea5cc-9cb4-4e62-924c-fa2763d747ec' WHERE title_name_en = 'sweatsuit';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F754db706-9350-49af-9506-55b48874d613%2F%25ED%2599%2588%25ED%258C%258C%25EC%259D%25B4%25EB%25B8%258C_%25EC%258B%259C%25EC%25A6%258C2_%25EB%258C%2580%25ED%2591%259C%25EC%259D%25B4%25EB%25AF%25B8%25EC%25A7%2580.jpg&blockId=f4c8aa72-aae8-408a-afc8-d140d77bc4bd' WHERE title_name_en = 'HOME5';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Fc844fb1e-e6da-4df0-920b-ad4ee8605a1e%2F%EB%8C%80%ED%91%9C%EC%9D%B4%EB%AF%B8%EC%A7%80_%EC%B5%9C%EC%A2%85.jpg&blockId=ed26c415-4f67-476b-96b2-62d476d5ae2b' WHERE title_name_en = 'spring and winter';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Fb7b78054-ea04-4fdb-adba-232a24089aa2%2F%EA%B2%81%EC%9F%81%EC%9D%B4.jpg&blockId=2bd07ffd-babd-4f40-a0eb-256a56ad1ac0' WHERE title_name_en = 'cowarldy_physical';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F857b38ae-3765-4225-9800-e2d1e96697b7%2F%EB%91%98%EC%A7%B8_%EC%96%BC%EA%B5%B4.jpg&blockId=f1fa0faf-1e0b-4c00-9f5c-9e48dfcfb90f' WHERE title_name_en = 'wooengtoon_four';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F8cecd719-5b0d-452e-ba11-207321103661%2F%EC%9A%B0%EB%A6%AC%EB%8A%94_%EB%A7%A4%EC%9D%BC%EB%A7%A4%EC%9D%BC.jpg&blockId=e0d4506d-a2f6-49b6-88b7-843f64e551c3' WHERE title_name_en = 'we_are_everyday';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F768cd624-aa1f-40bc-bc62-1563d835c2fb%2F%EC%BB%A4%EB%B2%84%EC%9D%B4%EB%AF%B8%EC%A7%80.jpg&blockId=0c8206d4-7eb5-4de2-8d96-3fb52c961cec' WHERE title_name_en = 'day_say_hey';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F0af4c4b4-b6c8-44c7-8992-f97fd4fe7b54%2F%EC%95%84%EC%8A%A4%EB%9D%BC%EC%9D%B4_title_%EB%B3%B5%EC%82%AC.png&blockId=80f0f9f6-bd7d-4175-9c7d-50caf0b9b7e8' WHERE title_name_en = 'dimly_dontforgetme';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F18805a19-817a-449c-8569-7a2d8bb82d3b%2F%EB%A3%A8%EB%82%98_%EC%9D%BC%EB%9F%AC%EC%8A%A4%ED%8A%B8_8.jpg&blockId=3d6a8b33-5fc2-4616-9449-1adf23ea5712' WHERE title_name_en = 'Luna';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Ff7640586-036f-4c38-93b3-b9d0b39dc600%2F%EB%B0%98%ED%88%AC%EB%AA%85%EB%B6%81%EC%8A%A4%ED%91%9C%EC%A7%80.jpg&blockId=ec45f39b-a759-48e1-be75-023b7a11f0b3' WHERE title_name_en = 'half_invisibleman';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F728a912f-c2f7-47f8-bd06-4bc3cc4b86e6%2F%EB%82%B4%EA%B0%80_%EB%88%84%EA%B5%AC%EA%B0%9C_%EB%8C%80%ED%91%9C%EC%9D%B4%EB%AF%B8%EC%A7%80.jpg&blockId=93d7407c-d939-4c96-a61e-003cacbe06d7' WHERE title_name_en = 'Who am I';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F08918a96-661f-4f8e-8a83-c9fd5cd931db%2F%EB%8C%80%ED%91%9C%EC%84%AC%EB%84%A4%EC%9D%BC.jpg&blockId=6576bb2d-d113-4ee7-8566-f8cf71bfea1d' WHERE title_name_en = 'Devil Number 4';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F3da26293-0902-40b0-913d-f8e8dda15221%2F%EB%8C%80%ED%91%9C%EC%9D%B4%EB%AF%B8%EC%A7%80_%EA%B0%80%EB%A1%9C%ED%98%95.jpg&blockId=fbb4ff95-5f20-4ee1-905c-c031430d4e1a' WHERE title_name_en = 'stuffed_animals';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2F782801ca-3dcc-4751-8a08-4267aa829022%2F3e3662f3-97a8-461c-9f2a-956d899521a2%2F%25EA%25BD%2583%25EC%2597%2590_app_headline.jpg&blockId=4902abd8-630d-4e73-b786-fe7299bdfd0c' WHERE title_name_en = 'springblooming';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F8dcad99e-16af-4d3b-8c43-901b31e7866c%2F%ED%99%A9%EA%B8%88%EC%9D%98%ED%95%B8%EB%93%9C%EB%A9%94%EC%9D%B4%EC%BB%A4_%EB%84%A4%EC%9D%B4%EB%B2%84%EB%B6%81%EC%8A%A4%ED%91%9C%EC%A7%80_1.jpg&blockId=39786f9a-a714-4fed-96f2-58aef624d497' WHERE title_name_en = 'handmaker_thegold';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Fd9be768e-196a-4de9-86ff-a612a4ca6f4f%2F%EC%95%84%EC%82%AC%EC%9D%B4_%EB%91%90%EB%B2%88%EC%A7%B8_%EB%B0%B0%EB%84%88.jpg&blockId=c8ca8102-20c7-4898-8f50-ac27e9a642c5' WHERE title_name_en = 'story_someone_i_know';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Ff455c07a-4eb1-421e-8326-c4a6cd9bd262%2F%EC%8D%B8%EB%84%A4%EC%9D%BC_%ED%9B%84%EB%B3%B41.png&blockId=7e66b3d9-826c-46af-aa85-089ef85a812b' WHERE title_name_en = 'comedyclass';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F640d0fe0-6fd1-4ae9-86fd-da7bde95f8b3%2F%EC%BB%A4%EB%B2%84%EC%9D%B4%EB%AF%B8%EC%A7%80(%EB%8F%84%EB%AC%B8%EB%8C%80%EC%9E%91).jpg&blockId=60fef466-d7e0-43a7-b964-75e1da8b1132' WHERE title_name_en = 'Great materpiece';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F822f6090-9db6-44f8-a36d-ffa754751f30%2F%EB%9F%AC%EB%B8%8C%EC%95%A4%EC%9C%84%EC%8B%9C.jpg&blockId=080682ce-6b51-4e8f-94ec-b7a52c91fb0d' WHERE title_name_en = 'love&wish';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F125889cb-5f8b-44ea-abb9-fb1efd885f0c%2FUntitled.png&blockId=aa2f39e4-76ca-4585-a02e-28c6357aef8e' WHERE title_name_en = 'Dead Life';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F98848ce6-27de-49c9-bbab-39d0465f190c%2F%EC%8D%B8%EB%84%A4%EC%9D%BC.png&blockId=e91fa4f7-ba64-4fd7-82cf-5f355dea308f' WHERE title_name_en = 'end_and_start';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Ff5017bf0-59ff-4071-a727-59ad06e5770b%2F%EC%82%AC%EB%9E%91%EC%96%91%EC%9E%A5%EC%A0%90_%ED%99%8D%EB%B3%B4%EC%9A%A9%EC%9D%B4%EB%AF%B8%EC%A7%802.png&blockId=144675c7-2ee4-41f0-885e-237bfc5cdef1' WHERE title_name_en = 'love_boutique';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2F782801ca-3dcc-4751-8a08-4267aa829022%2F2af2ab79-9b6b-4728-a153-f101d64fe9d2%2F%25EB%258C%2580%25ED%2591%259C%25EC%259D%25B4%25EB%25AF%25B8%25EC%25A7%2580_%25EA%25B0%2580%25EB%25A1%259C.jpg&blockId=a48070ab-635f-4bfa-b2d3-d9d2cab6149d' WHERE title_name_en = 'pumpkintime';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F2bbc7188-4841-442d-b841-c9871d8298b6%2F%EB%8C%80%ED%91%9C%EC%9D%B4%EB%AF%B8%EC%A7%80_(1).jpg&blockId=15c1bfc4-d58e-4937-9862-fa3bdc52c3c6' WHERE title_name_en = 'Guess who my future husband is.';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F8d28a966-1bdc-4f46-9720-81a316815682%2Fnpc.jpg&blockId=6b408e9c-1519-47bd-b345-554e4c9f30d9' WHERE title_name_en = 'NPC';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Ff548ea23-7cd8-4311-93b1-8eb028bf97e2%2F%EC%96%B8%EB%AC%B4%EB%93%9C%EC%85%80%EB%9D%BC-%EC%8D%B8%EB%84%A4%EC%9D%BC-%EC%B5%9C%EC%A2%85.jpg&blockId=e02a3310-bceb-426d-9bd2-1fc002835664' WHERE title_name_en = 'unmoodsella';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Fd8fe64bf-6de1-4f67-93b3-d81bc54314ea%2F%EB%A1%9C%EA%B3%A0%EB%8B%A4.jpg&blockId=d546a5c0-b0df-442e-b43d-7d6537d1a0d7' WHERE title_name_en = 'mayago';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F7ebceb92-b0cb-43ae-a5c4-db9988912953%2F02%EC%98%86%EC%A7%91%EC%97%AC%EC%9E%90_%EC%A3%BC%EC%9D%B8%EA%B3%B5.png&blockId=7145f43f-a37b-4fac-a930-5fbf72c14283' WHERE title_name_en = 'crack';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F6a7fde85-b50e-47a1-9dab-4fa567e00c66%2F%EB%8C%80%ED%91%9C%EC%9D%B4%EB%AF%B8%EC%A7%80_%EC%84%B8%EB%A1%9C.jpg&blockId=7cc33ac7-67bb-457d-911e-17b8434b9ba4' WHERE title_name_en = 'Watch out for your boyfriend';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F843ad7dd-9b89-4be6-a248-7d141bd75ba8%2F%EB%9F%AD%ED%82%A4%EA%B3%A0%ED%95%B4%ED%94%BC_(1).jpg&blockId=9e03cf00-b89a-4826-9c38-98842e2b037b' WHERE title_name_en = 'luckygohappy';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Fd454b12f-d015-42f4-82b4-4166fbb18c8c%2F%EA%B7%B8%EB%9E%98%EB%8F%84%EC%82%AC%EB%9E%91%ED%95%B4.jpg&blockId=3a183c8d-4825-4d55-a0a3-310ace7a3614' WHERE title_name_en = 'But I still love you';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Feb2b626b-d9e1-4f3a-b980-e8ae59dd9b38%2F%EA%B3%B5%EC%9C%A0%ED%95%98%EB%8A%94_%EC%A7%91_%EB%B0%B0%EB%84%88.jpg&blockId=2cf468ab-25c8-4dde-8825-f00d498275e1' WHERE title_name_en = 'share house';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2F782801ca-3dcc-4751-8a08-4267aa829022%2F9b7ae83b-d3e6-48a8-abff-7c439df72a81%2F2.jpg&blockId=f0d8ca0b-1fbe-4469-9404-05923ea41720' WHERE title_name_en = 'Never Mind Darling';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F002c999d-3725-4af0-ad64-68330b814c4c%2F02.jpg&blockId=93e597a1-a953-42cd-bbc2-bcb60d633d3e' WHERE title_name_en = 'Idol House';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F48dd014c-dc2e-4a45-8986-cfee93547587%2F%EB%8C%80%ED%91%9C%EC%9D%B4%EB%AF%B8%EC%A7%80.jpg&blockId=3b10d252-cb3c-448a-81d7-bb0e0387e8d6' WHERE title_name_en = 'red';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F2b78c509-4593-49fb-8333-df8f64669350%2F%EC%BD%94%EC%BD%94%EC%8A%A4%ED%8A%9C.jpeg&blockId=7908aa65-392b-4737-9f95-16481b85b9cf' WHERE title_name_en = 'cocostew';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F1365c0ab-08f6-4094-bc1a-523b05a0d4a1%2F25%ED%99%94-%ED%83%80%EC%9D%B4%ED%8B%80.jpg&blockId=a0ef1c05-f439-4a20-9cce-425c3c897be1' WHERE title_name_en = 'the_possession';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F16a0a932-8a5e-4c58-a9c6-4b54a8b8a5de%2F%EC%9D%BC%EB%9F%AC%EC%8A%A4%ED%8A%B8_%EC%82%AC%EC%9D%B4%EC%A6%88%EC%A1%B0%EC%A0%88%EB%B3%B82.png&blockId=6504e624-2938-4ece-9064-33321a1dc8ac' WHERE title_name_en = 'Like You''ve Never Been Hurt';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Fba6222b1-c870-4c32-9bdc-e193de59c1e1%2F%EC%82%AC%EB%9E%91%EC%9D%B4%EC%BB%A4%EB%8B%A4%EB%9E%98%EB%B0%B0%EB%84%88.png&blockId=bbae1400-c5f3-41d1-a874-99f135ba52d4' WHERE title_name_en = 'love_is_big';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Febaf31dd-9893-4196-b873-0a86f4a44041%2F%EC%84%B8%EB%A1%9C_%EB%B0%B0%EB%84%88.jpg&blockId=ed128a68-fcca-4936-8fc4-ef7a99a73b7f' WHERE title_name_en = 'the_extreme';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Faa30cf9f-6050-4d55-9447-293df8dd6b58%2F%EC%95%84%EC%9E%84%ED%8E%AB4%EB%B0%B0%EB%84%88_%EB%B3%B5%EC%82%AC.png&blockId=2c0b3e02-42dc-4c4b-b215-e8301743404b' WHERE title_name_en = 'iampet_4';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Ffe7b6dc5-89f1-4345-b278-24b7fcadad70%2F%EB%8C%80%ED%91%9C%EC%9D%B4%EB%AF%B8%EC%A7%80_%EC%84%B8%EB%A1%9C%ED%98%95.jpg&blockId=c97b69e6-e70c-4526-82ec-c6cc0ef285e5' WHERE title_name_en = 'neighbor_taste';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F67a64e30-89ef-4090-ba6b-c66b4883e5b4%2F%25EC%2597%25BC%25EB%259D%25BC%25EC%259D%2598_%25EC%2588%25A8%25EA%25B2%25B0_%25EB%258C%2580%25ED%2591%259C%25EC%259D%25B4%25EB%25AF%25B8%25EC%25A7%2580.jpg&blockId=12ae327f-6fae-458f-92ee-25b60d7c30ef' WHERE title_name_en = 'A good relationship';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F5a129377-8973-4bb9-aa72-253a0326a034%2F034-%EC%9C%8C%EC%9C%A0%EB%A9%94%EB%A6%AC01.png&blockId=a7e7dcef-8ffc-4bb6-b7d9-03236d8a39c8' WHERE title_name_en = 'will_you_marry_me';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F064d0237-3eb6-4b0d-9ac9-5ad7e05b6aec%2F%EB%8C%80%ED%91%9C%EC%9D%B4%EB%AF%B8%EC%A7%80_%EC%B9%B4%EC%B9%B4%EC%98%A4%ED%8E%98%EC%9D%B4%EC%A7%80.jpg&blockId=68eca8ae-8266-4774-9a42-934c8f3c27f1' WHERE title_name_en = 'is love delicious fried as well?';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Fea023157-9842-4879-bf7d-b6fd3e48d47a%2F%EB%8C%80%ED%91%9C%EC%9D%B4%EB%AF%B8%EC%A7%80.jpg&blockId=b86ddca7-9911-4467-bc0a-528325920beb' WHERE title_name_en = 'The owner is two-time.';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Fea958da8-5e25-4ca1-a0c0-d8b09a138feb%2F%EB%8C%80%ED%91%9C_%EC%9D%B4%EB%AF%B8%EC%A7%80.jpg&blockId=2697d679-1b1c-4cdb-a746-4975ba8048e0' WHERE title_name_en = 'hang byun sin';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F6582cd46-111d-46f1-af58-5190fcc5dd91%2FB.png&blockId=ecfaffbb-6e15-4a1e-945b-22bc6eb05640' WHERE title_name_en = 'ddasick';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F8692ba23-94a1-443e-b164-8cbb32f8f318%2F%EC%86%8C%EC%9D%8C%EC%8B%9C%EB%A6%AC%EC%A6%88.jpg&blockId=19b5eb8f-4afd-46f4-a006-28e2b3e3a6f3' WHERE title_name_en = 'noise';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F7aaa1010-f1f3-4fcb-a71c-a8e7e7dcd1e8%2F005-1_%EB%B3%B5%EC%82%AC.png&blockId=1c0453f2-5066-4fb2-9efd-c0d6caa15aef' WHERE title_name_en = 'moosick';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Ff0411885-e2d8-4b4e-8f6e-543406835ca6%2F14401000%EB%B0%B0%EB%84%88.jpg&blockId=61630920-51c6-4dd1-aa18-24867fe4d110' WHERE title_name_en = 'serendipity';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F40b3c169-f4d3-4b6b-8a28-92bbd201a7ef%2F%EC%A0%88%EA%B0%95-%EC%BB%A4%EB%B2%84%EC%9D%B4%EB%AF%B8%EC%A7%80-new.png&blockId=0e494ddc-841e-4db9-bbf9-338f0dfef32e' WHERE title_name_en = 'bowing_puppy';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Fc1a107d2-24ae-4878-9eb4-5c4ba121f30f%2F%EB%B0%B0%EB%84%88.jpg&blockId=7f20633a-6c6c-4566-8b58-7b95dc3c9868' WHERE title_name_en = 'evergreen';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F33c2c7d0-bf69-4f0f-b7e3-8163bf5f51a4%2F%EB%B0%B0%EB%84%88-1500x1000.jpg&blockId=ed939bcf-dbc6-473b-b248-6e6a757f3b5b' WHERE title_name_en = 'gyoun-woo and Seon-nyeo.';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Fc62d06e0-b1e6-4f7e-a17d-ec8893b86a2c%2F%EC%8B%9C%EB%A6%AC%EC%A6%88-%EA%B6%8C%ED%98%B8%EC%8D%B8%EB%84%A4%EC%9D%BC.jpg&blockId=c50b255d-1a6e-427f-aa45-cb91be6438d7' WHERE title_name_en = 'Sweet salty';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Fcadf4977-8a83-4404-84fc-00fc1319ef4d%2F%EC%8D%B8%EB%84%A4%EC%9D%BC.jpg&blockId=ed7f1398-cf21-4943-ad99-c0531335ca00' WHERE title_name_en = 'the_sichitkingdom';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F1952f048-c5d9-4fe0-8d52-fe66d2224b19%2F%EC%8D%B8%EB%84%A4%EC%9D%BC.jpeg&blockId=60ce66ee-4f6d-4f0a-a5ed-d3cbedcb7d74' WHERE title_name_en = 'magician';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F352b867f-da84-4ea4-a89e-effe805dfa7d%2F%EC%A7%80%EA%B5%AC%EC%9D%98%EC%A3%BC%EC%9D%B8%EA%B3%BC_%EB%AF%B8%EB%A6%AC%EB%B3%B4%EA%B8%B0.jpg&blockId=851de747-6a94-4c16-b89c-7887ae2ec0b7' WHERE title_name_en = 'owner_and_me';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F923982d9-05df-4659-8f72-4b31650e512e%2F%EB%82%98%EC%8B%B8.png&blockId=e0be5e4e-1750-47a1-959f-4303a074d58d' WHERE title_name_en = 'NASSA';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Fda35bd28-bda8-47e7-b484-04c395302f4c%2F%EC%9D%BC%EB%9F%AC%EC%8A%A4%ED%8A%B8.jpg&blockId=51602440-e9cd-4c4f-9e43-a0d108050c18' WHERE title_name_en = 'Ideal Us';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F113a8c03-55a3-4016-9247-699fa60f7a41%2F%EB%B9%84%EC%84%B1%EC%9D%B8_%ED%8F%AC%EC%8A%A4%ED%84%B0.jpg&blockId=cdf9a36e-37b8-4fcb-beb4-35d647b54ae0' WHERE title_name_en = 'removing';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F7367f965-5456-4d8a-8b6c-903940f2a8d2%2F%EB%82%98%ED%99%80%EB%A1%9C.jpg&blockId=ed10c85b-9a0c-47fe-85b5-fd303d59057d' WHERE title_name_en = 'Alone_on_the_island';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2F782801ca-3dcc-4751-8a08-4267aa829022%2F0c2c9577-5dc0-42f3-8194-58d8dc36b3dd%2F%25EC%25BB%25A4%25EB%25B2%2584_%25EC%259D%25B4%25EB%25AF%25B8%25EC%25A7%2580.jpg&blockId=72b60758-f73e-4cdb-8d71-b1052860682a' WHERE title_name_en = 'dangerous_cohabitation';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Fcaa470b7-7129-4f50-97c0-5c9a4780b007%2FUntitled.png&blockId=b8d6bf2b-2027-4691-a5ad-75fe1ca744e7' WHERE title_name_en = '2D Comedy';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F02d6f563-32fa-4561-9bb0-21798995efe1%2F%EC%95%88%EB%85%95%EB%8F%84%EA%B9%A8%EB%B9%84_%EB%AA%A8%EB%B0%94%EC%9D%BC_%ED%97%A4%EB%93%9C%EB%9D%BC%EC%9D%B8.jpg&blockId=4dfcc314-7c22-4661-9e4b-7f169fce771d' WHERE title_name_en = 'hello_doggaebi';
UPDATE titles SET title_image = 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2Fc6841d27-82fa-4eae-91ca-d0d17660bb3b%2F%EB%8C%80%ED%91%9C%EC%9D%B4%EB%AF%B8%EC%A7%80_%EA%B0%80%EB%A1%9C.jpg&blockId=f550d02d-ef37-442c-8b94-0ad0dcb2e83e' WHERE title_name_en = 'boogie_movie';
*/

-- Verification query to check updated records:
SELECT title_name_en, title_image, updated_at 
FROM titles 
WHERE title_name_en IN (
    'Crush on You',
    'ex_girlfriend',
    'dreaming',
    'smartphone addict',
    'steelman',
    'why_club',
    'butterfly_girl',
    'Punk',
    'Cross the universe nine times.',
    'authority_of_the_operator',
    'cat_ggeong',
    'Throughout the winter',
    'my_alien_dad',
    'findingme',
    'Never Mind Darling',
    'namepen_toon',
    'ex_wife',
    'love_translrator',
    'Becoming_Bad',
    'dealingthedead',
    'shadowy beauty',
    'human market',
    'https://data.oopy.io/ weangtoon5',
    'chosun_SUPERidol',
    'love_hate_relationship',
    'melancholy',
    'fate',
    'I''ll do everything for you',
    'beauty_maker',
    'BIG_maknae',
    'Change_me',
    'demoniac',
    'her_bucketlist',
    'smart_family',
    'witch_loveornot',
    'Luck 4 you',
    'cryingrabbit',
    'the_trauma',
    'Never Mind Darling',
    'HOPErestaurant',
    'beneficial_pervert',
    'sweatsuit',
    'HOME5',
    'spring and winter',
    'cowarldy_physical',
    'wooengtoon_four',
    'we_are_everyday',
    'day_say_hey',
    'dimly_dontforgetme',
    'Luna',
    'half_invisibleman',
    'Who am I',
    'Devil Number 4',
    'stuffed_animals',
    'springblooming',
    'handmaker_thegold',
    'story_someone_i_know',
    'comedyclass',
    'Great materpiece',
    'love&wish',
    'Dead Life',
    'end_and_start',
    'love_boutique',
    'pumpkintime',
    'Guess who my future husband is.',
    'NPC',
    'unmoodsella',
    'mayago',
    'crack',
    'Watch out for your boyfriend',
    'luckygohappy',
    'But I still love you',
    'share house',
    'Never Mind Darling',
    'Idol House',
    'red',
    'cocostew',
    'the_possession',
    'Like You''ve Never Been Hurt',
    'love_is_big',
    'the_extreme',
    'iampet_4',
    'neighbor_taste',
    'A good relationship',
    'will_you_marry_me',
    'is love delicious fried as well?',
    'The owner is two-time.',
    'hang byun sin',
    'ddasick',
    'noise',
    'moosick',
    'serendipity',
    'bowing_puppy',
    'evergreen',
    'gyoun-woo and Seon-nyeo.',
    'Sweet salty',
    'the_sichitkingdom',
    'magician',
    'owner_and_me',
    'NASSA',
    'Ideal Us',
    'removing',
    'Alone_on_the_island',
    'dangerous_cohabitation',
    '2D Comedy',
    'hello_doggaebi',
    'boogie_movie'
)
ORDER BY title_name_en;

-- Count of updated records:
SELECT COUNT(*) as updated_count
FROM titles 
WHERE title_name_en IN (
    'Crush on You',
    'ex_girlfriend',
    'dreaming',
    'smartphone addict',
    'steelman',
    'why_club',
    'butterfly_girl',
    'Punk',
    'Cross the universe nine times.',
    'authority_of_the_operator',
    'cat_ggeong',
    'Throughout the winter',
    'my_alien_dad',
    'findingme',
    'Never Mind Darling',
    'namepen_toon',
    'ex_wife',
    'love_translrator',
    'Becoming_Bad',
    'dealingthedead',
    'shadowy beauty',
    'human market',
    'https://data.oopy.io/ weangtoon5',
    'chosun_SUPERidol',
    'love_hate_relationship',
    'melancholy',
    'fate',
    'I''ll do everything for you',
    'beauty_maker',
    'BIG_maknae',
    'Change_me',
    'demoniac',
    'her_bucketlist',
    'smart_family',
    'witch_loveornot',
    'Luck 4 you',
    'cryingrabbit',
    'the_trauma',
    'Never Mind Darling',
    'HOPErestaurant',
    'beneficial_pervert',
    'sweatsuit',
    'HOME5',
    'spring and winter',
    'cowarldy_physical',
    'wooengtoon_four',
    'we_are_everyday',
    'day_say_hey',
    'dimly_dontforgetme',
    'Luna',
    'half_invisibleman',
    'Who am I',
    'Devil Number 4',
    'stuffed_animals',
    'springblooming',
    'handmaker_thegold',
    'story_someone_i_know',
    'comedyclass',
    'Great materpiece',
    'love&wish',
    'Dead Life',
    'end_and_start',
    'love_boutique',
    'pumpkintime',
    'Guess who my future husband is.',
    'NPC',
    'unmoodsella',
    'mayago',
    'crack',
    'Watch out for your boyfriend',
    'luckygohappy',
    'But I still love you',
    'share house',
    'Never Mind Darling',
    'Idol House',
    'red',
    'cocostew',
    'the_possession',
    'Like You''ve Never Been Hurt',
    'love_is_big',
    'the_extreme',
    'iampet_4',
    'neighbor_taste',
    'A good relationship',
    'will_you_marry_me',
    'is love delicious fried as well?',
    'The owner is two-time.',
    'hang byun sin',
    'ddasick',
    'noise',
    'moosick',
    'serendipity',
    'bowing_puppy',
    'evergreen',
    'gyoun-woo and Seon-nyeo.',
    'Sweet salty',
    'the_sichitkingdom',
    'magician',
    'owner_and_me',
    'NASSA',
    'Ideal Us',
    'removing',
    'Alone_on_the_island',
    'dangerous_cohabitation',
    '2D Comedy',
    'hello_doggaebi',
    'boogie_movie'
);
