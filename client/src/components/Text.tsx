import React from 'react';
import styled from 'styled-components';

interface TextProps {
  /**
   * How large should the text be? Defaults to medium.
   */
  size?: 'xs' | 'small' | 'medium' | 'large' | 'xl';
  /**
   * Text content
   */
  content: string;
  /**
   * Top and bottom margins. Defaults to 1px.
   */
  tbMargin?: number;
  /**
   * Color override. Defaults to white.
   */
  color?: string;
}

interface ParaProps {
  size?: 'xs' | 'small' | 'medium' | 'large' | 'xl';
  tbMargin: number;
  color: string;
}

const StyledPara = styled.p`
  color: ${(props: ParaProps) => (props.color ? props.color : 'white')};
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
  margin-top: ${(props: ParaProps) => props.tbMargin + 'px'};
  margin-bottom: ${(props: ParaProps) => props.tbMargin + 'px'};
  margin-left: 0;
  margin-right: 0;
  font-size: ${(props: ParaProps) =>
    props.size === 'medium'
      ? '20px'
      : props.size === 'large'
      ? '32px'
      : props.size === 'xl'
      ? '64px'
      : props.size === 'xs'
      ? '10px'
      : '16px'};
`;

const Text = ({
  size = 'medium',
  tbMargin = 1,
  color = 'white',
  ...props
}: TextProps) => {
  return (
    <StyledPara color={color} size={size} tbMargin={tbMargin}>
      {props.content}
    </StyledPara>
  );
};

export default Text;
