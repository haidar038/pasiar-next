"use client";

interface DeleteModalProps {
    postTitle: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function DeleteConfirmationModal({ postTitle, onConfirm, onCancel }: DeleteModalProps) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
                <h2 className="text-lg font-bold">Konfirmasi Hapus</h2>
                <p className="mt-2 text-sm text-gray-600">
                    Apakah Anda yakin ingin menghapus kontribusi berjudul: <br />
                    <strong className="text-gray-900">"{postTitle}"</strong>?
                </p>
                <p className="mt-1 text-xs text-red-600">Tindakan ini tidak dapat diurungkan.</p>
                <div className="mt-6 flex justify-end space-x-3">
                    <button onClick={onCancel} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
                        Batal
                    </button>
                    <button onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
                        Ya, Hapus
                    </button>
                </div>
            </div>
        </div>
    );
}
