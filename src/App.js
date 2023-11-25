import {UserIcon, PaperAirplaneIcon} from '@heroicons/react/24/solid'

const messages = [{'text': 'Hello, my name is Sample User', 'sender': 'user'}, {'text': 'Hi Sample User, How can I help you today?', 'sender': 'bot'}]

let messageList = messages.map((message) => {
    if(message.sender === 'user') {
        return <div class="flex flex-row flex-nowrap justify-end">
                    <div class="bg-sky-300 rounded-lg p-2 m-2 text-lg font-crete font-bold border-black border-2">
                        {message.text}
                    </div>
                </div>
    }
    else {
        return <div class="flex flex-row flex-nowrap justify-start">
                    <div class="bg-white rounded-lg p-2 m-2 text-lg font-crete font-bold border-black border-2">
                        {message.text}
                    </div>
                </div>
    }
});

function App() {
  return (
      <div class="bg-slate-100 h-screen flex flex-col">
          <div class="flex flex-row flex-nowrap border-2">
              <div class="basis-1/2 font-bold font-crete p-3 text-3xl"> 
                  <h2>DiagnoseAI</h2>
              </div>
              <div class="basis-1/2 p-3 flex flex-row justify-end"> 
                    <UserIcon class="h-10 w-10 fill-black"/>
              </div>
          </div>
          <div class="flex flex-col flex-nowrap grow">
              <div class="flex flex-row flex-nowrap border-2 basis-1/8">
                  <div class="flex basis-1/2 p-3 items-center justify-center">
                        <button class="rounded-full bg-sky-300 border-black border-2 w-2/3 text-lg font-crete font-bold">Chat</button>
                  </div>
                  <div class="flex basis-1/2 p-3 items-center justify-center">
                        <button class="rounded-full bg-white border-black border-2 w-2/3 text-lg font-crete font-bold">History</button>
                  </div>
              </div>
              <div class="flex flex-col basis-3/4">
                    {messageList}
              </div>
              <div class="flex flex-row flex-nowrap basis-1/8 border-black border-2 p-3">
                    <textarea class="flex-grow p-3 text-lg font-crete font-bold " placeholder="Type your message here..."></textarea>
                  <PaperAirplaneIcon class="h-10 w-10 fill-sky-300"/>
              </div>
           </div>
      </div>
  );
}

export default App;
