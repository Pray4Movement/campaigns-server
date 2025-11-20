/**
 * Simple modal composable for showing error messages
 */
export const useModal = () => {
  const toast = useToast()

  const showError = async (message: string) => {
    toast.add({
      title: 'Error',
      description: message,
      color: 'red'
    })
  }

  return {
    showError
  }
}
