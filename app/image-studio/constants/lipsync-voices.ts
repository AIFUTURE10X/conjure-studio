/**
 * Kling lipsync TTS voices (fal-ai/kling-video/lipsync/text-to-video).
 * Full voice_id enum from the fal schema, grouped by language; each entry
 * carries the voice_language the API needs. Labels use Kling's community
 * names where established, otherwise a descriptive name.
 */

export interface LipSyncVoice {
  id: string
  label: string
  language: 'en' | 'zh'
}

export const ENGLISH_VOICES: LipSyncVoice[] = [
  { id: 'ai_kaiya', label: 'Kaiya — warm female', language: 'en' },
  { id: 'girlfriend_4_speech02', label: 'Melody — soft female', language: 'en' },
  { id: 'commercial_lady_en_f-v1', label: 'Commercial — polished female', language: 'en' },
  { id: 'chat1_female_new-3', label: 'Blossom — friendly female', language: 'en' },
  { id: 'chat_0407_5-1', label: 'Peppy — upbeat female', language: 'en' },
  { id: 'ai_shatang', label: 'Sisi — sweet female', language: 'en' },
  { id: 'genshin_vindi2', label: 'Sunny — bright female', language: 'en' },
  { id: 'genshin_kirara', label: 'Pixie — perky female', language: 'en' },
  { id: 'oversea_male1', label: 'Bryan — male narrator', language: 'en' },
  { id: 'reader_en_m-v1', label: 'Audiobook — male reader', language: 'en' },
  { id: 'calm_story1', label: 'Storyteller — calm male', language: 'en' },
  { id: 'zhinen_xuesheng', label: 'Sage — calm young male', language: 'en' },
  { id: 'AOT', label: 'Ace — heroic male', language: 'en' },
  { id: 'ai_chenjiahao_712', label: 'Deep voice — low male', language: 'en' },
  { id: 'uk_boy1', label: 'Oliver — UK young male', language: 'en' },
  { id: 'uk_man2', label: 'UK male', language: 'en' },
  { id: 'uk_oldman3', label: 'UK older male', language: 'en' },
  { id: 'genshin_klee2', label: 'Sprite — playful child', language: 'en' },
  { id: 'cartoon-boy-07', label: 'Buddy — cartoon boy', language: 'en' },
  { id: 'cartoon-girl-01', label: 'Cutie — cartoon girl', language: 'en' },
  { id: 'PeppaPig_platform', label: 'Peppa — cartoon piglet', language: 'en' },
]

export const CHINESE_VOICES: LipSyncVoice[] = [
  { id: 'chengshu_jiejie', label: 'Mature female', language: 'zh' },
  { id: 'you_pingjing', label: 'Calm female', language: 'zh' },
  { id: 'guanxiaofang-v2', label: 'Lively female', language: 'zh' },
  { id: 'tianmeixuemei-v1', label: 'Sweet junior girl', language: 'zh' },
  { id: 'girlfriend_1_speech02', label: 'Girlfriend — gentle', language: 'zh' },
  { id: 'girlfriend_2_speech02', label: 'Girlfriend — soft', language: 'zh' },
  { id: 'tianjinjiejie_speech02', label: 'Tianjin sister', language: 'zh' },
  { id: 'chuanmeizi_speech02', label: 'Sichuan girl', language: 'zh' },
  { id: 'zhuxi_speech02', label: 'Announcer male', language: 'zh' },
  { id: 'diyinnansang_DB_CN_M_04-v2', label: 'Deep bass male', language: 'zh' },
  { id: 'yizhipiannan-v1', label: 'Gentle male', language: 'zh' },
  { id: 'daopianyansang-v1', label: 'Husky male', language: 'zh' },
  { id: 'tiexin_nanyou', label: 'Caring boyfriend', language: 'zh' },
  { id: 'tiyuxi_xuedi', label: 'Sporty young male', language: 'zh' },
  { id: 'ai_huangzhong_712', label: 'Deep older male', language: 'zh' },
  { id: 'ai_huangyaoshi_712', label: 'Wise older male', language: 'zh' },
  { id: 'ai_laoguowang_712', label: 'Old king', language: 'zh' },
  { id: 'xianzhanggui_speech02', label: 'Old shopkeeper', language: 'zh' },
  { id: 'dongbeilaotie_speech02', label: 'Northeast dialect male', language: 'zh' },
  { id: 'chongqingxiaohuo_speech02', label: 'Chongqing lad', language: 'zh' },
  { id: 'chaoshandashu_speech02', label: 'Chaoshan uncle', language: 'zh' },
  { id: 'ai_taiwan_man2_speech02', label: 'Taiwanese male', language: 'zh' },
  { id: 'laopopo_speech02', label: 'Grandma', language: 'zh' },
  { id: 'heainainai_speech02', label: 'Kind grandma', language: 'zh' },
  { id: 'mengwa-v1', label: 'Cute toddler', language: 'zh' },
]

export const ALL_LIPSYNC_VOICES: LipSyncVoice[] = [...ENGLISH_VOICES, ...CHINESE_VOICES]

export function getVoiceById(id: string): LipSyncVoice | undefined {
  return ALL_LIPSYNC_VOICES.find((voice) => voice.id === id)
}
