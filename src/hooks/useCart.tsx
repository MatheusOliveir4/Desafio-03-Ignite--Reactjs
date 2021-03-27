import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {

      const productOnCart = cart.find(product => product.id === productId)
      
      if(productOnCart) {
        const {data: productOnStock} = await api.get(`stock/${productId}`)
  
        if(productOnCart.amount < productOnStock.amount) {
          const newCart = cart.map(product => {
            if(product.id === productId) {
              product.amount += 1
            }
            return product
          })

          setCart(newCart)
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart))
        } else {
          toast.error('Quantidade solicitada fora de estoque')
          return 
        }
      } else {
        let {data: newProduct} = await api.get(`products/${productId}`)
        
        const updatedCart = [...cart]
        
        newProduct = {
          ...newProduct,
          amount: 1,
        }

        updatedCart.push(newProduct)

        setCart(updatedCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
      }

    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const updatedCart = [...cart]
      const productIndex = cart.findIndex(product => product.id === productId)

      if(productIndex >= 0) {
        updatedCart.splice(productIndex, 1)
        setCart(updatedCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
      } else {
        throw Error()
      }
    } catch {
      toast.error('Erro na remoção do produto')
    }
  };

  const updateProductAmount = async ({productId, amount}: UpdateProductAmount) => {
    try {
      if (amount < 1) {
        return
      } 

      const {data: productOnStock} = await api.get(`stock/${productId}`)
      
      if(amount <= productOnStock.amount) {
        const productToUpdate = cart.find(product => product.id === productId)

        if(productToUpdate) {
          const newCart = cart.map(product => {
            if(productToUpdate.id === product.id) {
              product.amount = amount
            }

            return product
          })
          
          setCart(newCart)
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart))
        } else {
          throw Error
        }
      } else {
        toast.error('Quantidade solicitada fora de estoque')
        return
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto')
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
