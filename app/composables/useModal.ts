/**
 * Simple modal composable for showing error messages
 */
export const useModal = () => {
  const showError = async (message: string) => {
    // For now, just use alert. In the future, this can be replaced with a proper modal component
    alert(message)
  }

  return {
    showError
  }
}
