import React from 'react';
import { alignPinyinToText } from '../utils/rubyText';

function RubyChar({ char, py, showPinyin }: { char: string; py?: string; showPinyin: boolean }) {
  if (py) {
    return (
      <ruby>
        {char}
        <rp>(</rp>
        <rt style={showPinyin ? undefined : { visibility: 'hidden' }}>{py}</rt>
        <rp>)</rp>
      </ruby>
    );
  }
  return <span>{char}</span>;
}

export function RubyText({ text, pinyin, showPinyin }: {
  text: string;
  pinyin: string;
  showPinyin: boolean;
}) {
  const pairs = alignPinyinToText(text, pinyin);
  return (
    <>
      {pairs.map((pair, i) => (
        <RubyChar key={i} char={pair.char} py={pair.pinyin} showPinyin={showPinyin} />
      ))}
    </>
  );
}
