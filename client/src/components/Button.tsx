import React from 'react';
import styled from 'styled-components';
import Text from './Text';

interface ButtonProps {
  /**
   * Is this button disabled? Defaults to false.
   */
  disabled?: boolean;
  /**
   * How large should the button be? Defaults to medium.
   */
  size?: 'small' | 'medium';
  /**
   * Button contents
   */
  label: string;
  /**
   * Type override
   */
  type?: 'button' | 'submit' | 'reset';
  /**
   * Optional click handler
   */
  onClick?: () => void;
}

interface StyledButtonProps {
  size: 'small' | 'medium';
  disabled?: boolean;
}

const StyledButton = styled.button`
  background: none;
  min-width: ${(props: StyledButtonProps) =>
    props.size === 'medium' ? '200px' : '115px'};
  height: ${(props: StyledButtonProps) =>
    props.size === 'medium' ? '50px' : '30px'};
  border: 2px dashed
    ${(props: StyledButtonProps) => (props.disabled ? '#9A9A9A' : 'white')};
  border-radius: 5px;
  cursor: ${(props: StyledButtonProps) =>
    props.disabled ? 'auto' : 'pointer'};
`;

/**
 * Primary UI component for user interaction
 */
export const Button = ({
  size = 'medium',
  type = 'button',
  label,
  ...props
}: ButtonProps) => {
  return (
    <StyledButton type={type} size={size} {...props}>
      <Text
        color={props.disabled ? '#9A9A9A' : 'white'}
        size={size}
        content={label}
      />
    </StyledButton>
  );
};
