import axios from "axios";
import { showAlert } from "./alerts";

export const updateData = async (data, isPassword) => {
    try {
        const url = isPassword
            ? 'http://localhost:5000/api/v1/users/updateMyPassword'
            : 'http://localhost:5000/api/v1/users/updateMe';

        const res = await axios({
            method: 'PATCH',
            url,
            data
        });

        if (res.data.status === 'success') {
            const message = `${isPassword ? 'Password' : 'Data'} updated successfully`;

            showAlert('success', message);
        }

    } catch (err) {
        showAlert('error', err.response.data.message);
    }
};