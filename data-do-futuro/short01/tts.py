import asyncio,json,sys,edge_tts
import ssl,edge_tts.communicate as _c
_c._SSL_CTX=ssl.create_default_context(cafile="/root/.ccr/ca-bundle.crt")
async def main(voice,rate,out):
    text=open('narracao.txt').read().replace('\n',' ')
    c=edge_tts.Communicate(text,voice,rate=rate,pitch="+4Hz",boundary="WordBoundary")
    words=[]
    with open(out+'.mp3','wb') as f:
        async for ch in c.stream():
            if ch['type']=='audio': f.write(ch['data'])
            elif ch['type']=='WordBoundary': words.append({'t':ch['offset']/1e7,'d':ch['duration']/1e7,'w':ch['text']})
    json.dump(words,open(out+'.json','w'),ensure_ascii=False,indent=0)
    print(out,len(words),'palavras, fim em %.1fs'%(words[-1]['t']+words[-1]['d']))
asyncio.run(main(sys.argv[1],sys.argv[2],sys.argv[3]))
