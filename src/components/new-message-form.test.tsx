import { render } from '@testing-library/react';
import { NewMessageForm } from './new-message-form';

describe('NewMessageForm', () => {
    it('Only accepts only images', ()=> {
       const chat = render(<NewMessageForm/>);
       const imageInput = chat.baseElement.getElementsByTagName('input').item(0);
       expect(imageInput).toHaveAttribute('accept', '.png, .jpg, .jpeg');
    })
});
