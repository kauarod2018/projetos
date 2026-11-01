import React from 'react';
import {Composition, AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig} from 'remotion';
const Teste: React.FC = () => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig();
  const s = spring({frame: f, fps});
  return <AbsoluteFill style={{background:'#111',justifyContent:'center',alignItems:'center'}}>
    <div style={{color:'white',fontSize:120,fontFamily:'sans-serif',transform:`scale(${s})`,opacity:interpolate(f,[0,15],[0,1])}}>Teste OK</div>
  </AbsoluteFill>;
};
export const Root: React.FC = () => <Composition id="Teste" component={Teste} durationInFrames={60} fps={30} width={1080} height={1920}/>;
