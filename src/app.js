import { EditorState } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { defaultKeymap, history, indentWithTab } from '@codemirror/commands';
import { basicSetup } from 'codemirror';
import { javascript } from '@codemirror/lang-javascript';
import axios from 'axios';

const app = () => {
  const state = {
    status: 'stop',
    lastChange: '',
  };

  const elements = {
    textInput: document.querySelector('.input'),
    textOutput: document.querySelector('.output'),
    buttons: document.querySelector('.buttons'),
    switch: document.querySelector('.switch'),
  };

  const extensions = [
    basicSetup,
    javascript(),
    keymap.of([defaultKeymap, history, indentWithTab]),
  ];

  const startState = EditorState.create({
    extensions,
  });

  const view = new EditorView({
    state: startState,
    parent: document.body,
  });

  elements.textInput.append(view.dom);

  const autoUpdate = async () => {
    const configFile = {
      language: 'javascript',
      version: '1.32.3',
      files: [{ content: view.state.doc.toString() }],
      runtime: 'deno',
    };
    if (
      state.status === 'run'
      && state.lastChange !== view.state.doc.toString()
    ) {
      try {
        const response = await axios.post(
          'https://emkc.org/api/v2/piston/execute',
          configFile,
        );
        elements.textOutput.innerHTML = response.data.run.stdout === ''
          ? response.data.run.output.split('\n')[0]
          : response.data.run.stdout;
      } catch (error) {
        elements.textOutput.innerHTML = error.message;
      }
      state.lastChange = view.state.doc.toString();
    }
    setTimeout(autoUpdate, 1000);
  };

  elements.switch.addEventListener('click', () => {
    if (state.status === 'stop') {
      state.status = 'run';
      elements.switch.textContent = 'Stop';
    } else {
      state.status = 'stop';
      elements.switch.textContent = 'Run';
    }
  });
  autoUpdate();
};

export default app;
